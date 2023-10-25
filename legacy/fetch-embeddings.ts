import fs = require('fs');
import fsp = require('node:fs/promises');
import path = require('path');
import axios = require('axios');
import crypto = require("node:crypto");
import * as PullRequestQuery from './graphql-dts/prs';
import * as IssuesQuery from './graphql-dts/issues';
import * as MoreIssueTimelineItemsQuery from './graphql-dts/moreIssueTimelineItems';
import * as MorePrTimelineItemsQuery from './graphql-dts/morePrTimelineItems';

const USE_AZURE = true;
const BATCH_SIZE = 1;
const MAX_POST_LENGTH = 2048;

const apiKey = process.env.EMBEDDING_KEY ?? fail("Set EMBEDDING_KEY env var");

type Issue = IssuesQuery.issues_repository_issues_edges_node;
type IssueTimelineItem = MoreIssueTimelineItemsQuery.moreIssueTimelineItems_repository_issue_timelineItems_edges;
type PullRequest = PullRequestQuery.prs_repository_pullRequests_edges_node;
type PullRequestTimelineItem = MorePrTimelineItemsQuery.morePrTimelineItems_repository_pullRequest_timelineItems_edges;

type DiskEmbed = {
    refs: string[],
    vector: number[],
    body: string
};

const IgnoreList = ["typescript-bot"];

export async function generateEmbeddings(dataDir: string) {
    console.log("Reading issues...");
    const issues: Issue[] = read(path.join(dataDir, "issue"));
    console.log(`Read ${issues.length} issues`);
    issues.sort((a, b) => {
        return (+new Date(a.createdAt)) - (+new Date(b.createdAt));
    });
    //console.log("Reading PRs...");
    //const prs: PullRequest[] = read(path.join(dataDir, "pr"));

    if (issues.length > 0) {
        console.log("Making issue embeddings");
        await fetchIssueEmbeddings(issues);
    }
    console.log("Making comment embeddings");
    await fetchCommentEmbeddings(issues, []);

    function read(directory: string) {
        const result: any[] = [];
        if (fs.existsSync(directory)) {
            const entries = fs.readdirSync(directory);
            console.log(`Found ${entries.length} issues in ${directory}`);
            for (const fn of entries) {
                result.push(JSON.parse(fs.readFileSync(path.join(directory, fn), { encoding: "utf-8" })));
                // break;D:\github\git-csv\embeds\b059777f96b94cd2a3ba20f3.json
            }
        }
        return result;
    }
}

async function fetchEmbeddings(input: string[]): Promise<number[][]> {
    // Empty string will crash the request
    input = input.map(s => (s === "" ? "(blank)" : s));
    let result: { data: { embedding: number[], index: number }[] };
    if (USE_AZURE) {
        const client = axios.default.create({
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json"
            }
        });

        // https://learn.microsoft.com/en-us/azure/cognitive-services/openai/reference#embeddings
        const resourceName = "devdiv-test-playground";
        const deployment = "text-embedding-ada-002";
        const apiVersion = "2023-05-15";
        const url = `https://${resourceName}.openai.azure.com/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
        const user = "ryanca@microsoft.com";
        const params = {
            input,
            user
        };
        try {
            result = (await client.post(url, params)).data;
        } catch (e) {
            console.log(params);
            console.log(`Error: ${JSON.stringify(e)}`);
            throw e;
        }
    } else {
        const client = axios.default.create({
            headers: { 'Authorization': 'Bearer ' + apiKey }
        });

        // https://platform.openai.com/docs/api-reference/embeddings/create
        const url = 'https://api.openai.com/v1/embeddings';
        const model = "text-embedding-ada-002";
        const params = {
            input,
            model
        };
        try {
            result = (await client.post(url, params)).data;
        } catch (e) {
            console.log(`Error: ${JSON.stringify(e)}`);
            throw e;
        }
    }

    const output: number[][] = [];
    for (const e of result.data) {
        output[e.index] = e.embedding;
    }
    return output;
}

async function fetchIssueEmbeddings(issues: readonly Issue[]) {
    const issuesLeft = [...issues];
    const thisBatch: IssueDigest[] = [];
    while (issuesLeft.length > 0) {
        const issue = issuesLeft.pop()!;
        if (shouldIgnoreUser(issue.author)) continue;

        const digest = getIssueDigest(issue);
        if (await tryUpdateDiskEmbedding(digest, null)) {
            // Already up to date
            continue;
        } else {
            thisBatch.push(digest);
        }

        // Add to worker queue and maybe process a batch
        if (thisBatch.length === BATCH_SIZE) {
            await processBatch();
        }
    }

    // Clear out the final ones
    await processBatch();

    async function processBatch() {
        if (thisBatch.length === 0) return;

        const embeddings = await fetchEmbeddings(thisBatch.map(i => i.body));
        if (embeddings.length !== thisBatch.length) throw new Error("Lengths did not match");
        for (let i = 0; i < thisBatch.length; i++) {
            const res = await tryUpdateDiskEmbedding(thisBatch[i], embeddings[i]);
            console.assert(res, "Update digest should have succeeded");
        }
        thisBatch.length = 0;
    }
}

type IssueDigest = ReturnType<typeof getIssueDigest>;
function getIssueDigest(issue: Issue) {
    const body = cleanString(issue.body).substring(0, MAX_POST_LENGTH);
    const hash = hashStr(body);
    const ref: string = issue.url;
    return ({
        ref,
        body,
        hash
    });
}

function getCommentDigest(issue: { body: string }, url: string): IssueDigest {
    const body = cleanString(issue.body).substring(0, MAX_POST_LENGTH);
    const hash = hashStr(body);
    const ref: string = url;
    return ({
        ref,
        body,
        hash
    });
}

export function cleanString(s: string) {
    // Remove HTML comments
    s = s.replace(/<\!--[\s\S]+?-->/g, "");
    // Remove #, ##, and ### section headers
    s = s.replace(/^#.*$/gm, "");
    s = s.replace(/^##.*$/gm, "");
    s = s.replace(/^###.*$/gm, "");
    // Compress newlines
    s = s.replace(/\r\n/g, "\n");
    // Compress consectuive newlines
    s = s.replace(/\n\n+/g, "\n");
    // Compress consecutive spaces
    s = s.replace(/ [\s+]/g, " ");
    return s;
}

async function tryUpdateDiskEmbedding(issue: IssueDigest, actualVector: number[] | null): Promise<boolean> {
    const filename = getEmbedFilename(issue);
    try {
        const json: DiskEmbed = JSON.parse(await fsp.readFile(filename, "utf-8"));
        if (json.refs.indexOf(issue.ref) >= 0) {
            // Up to date, do nothing
            console.log(`${issue.ref} is up-to-date at ${filename}`);
        } else {
            // Add ref and write
            console.log(`${issue.ref} adds a ref to ${filename}`);
            json.refs.push(issue.ref);
            await fsp.writeFile(filename, JSON.stringify(json, undefined, 2), "utf-8");
        }
        return true;
    } catch {
        // File doesn't exist; write it if we have the info
        if (actualVector !== null) {
            const json: DiskEmbed = {
                refs: [issue.ref],
                body: issue.body,
                vector: actualVector
            };
            console.log(`${issue.ref} writes a new file ${filename}`);
            await fsp.writeFile(filename, JSON.stringify(json, undefined, 2), "utf-8");
            return true;
        }
        // No file exists and no info
        return false;
    }
}

async function fetchCommentEmbeddings(issues: Issue[], prs: PullRequest[]) {
    for (const issue of issues) {
        for (const comment of issue.timelineItems?.edges ?? []) {
            if (comment?.node?.__typename === "IssueComment") {
                if (shouldIgnoreUser(comment.node.author)) continue;

                const digest = getCommentDigest(comment?.node, issue.url);
                if (await tryUpdateDiskEmbedding(digest, null)) {
                    // Already up to date
                    continue;
                } else {
                    // Fetch this
                    const embedding = (await fetchEmbeddings([digest.body]))[0];
                    await tryUpdateDiskEmbedding(digest, embedding);
                }
            }
        }
    }
}

function shouldIgnoreUser(x: null | { login?: string }) {
    return IgnoreList.indexOf(x?.login!) >= 0;
}
/*
async function getEmbedding(tag: string, input: string) {
    input = input.substring(0, 1024);
    const hash = hashStr(input);
    const filename = getEmbedFilename(hash);

    try {
        const json = await fsp.readFile(filename, "utf-8");
        const obj = JSON.parse(json);

        if (Array.isArray(obj)) {
            // Upgrade this file
            await fsp.writeFile(filename, JSON.stringify({
                refs: [tag],
                content: input,
                vector: obj
            }, undefined, 2), "utf-8");
            console.log('Upgrade');
        } else if (!obj.refs.includes(tag)) {
            // Add this ref
            obj.refs.push(tag);
            await fsp.writeFile(filename, JSON.stringify(obj, undefined, 2), "utf-8");
            console.log('Add ref');
        } else {
            // Up-to-date
            console.log('UTD');
        }
    } catch {
        const params = {
            "input": input,
            "model": "text-embedding-ada-002"
        };

        console.log('Fetching for ' + filename);
        const result = await client.post('https://api.openai.com/v1/embeddings', params);
        try {
            const str = JSON.stringify({
                refs: [tag],
                content: input,
                vector: result.data.data[0].embedding
            }, undefined, 2)
            fs.writeFile(filename, str, { encoding: 'utf-8' }, () => { });
            console.log('Did one');
        } catch (e) {
            console.error(e);
            // console.error(JSON.stringify(e));
        }
    }
}
*/

function fail(s: string): never {
    throw new Error(s);
}

function hashStr(s: string): string {
    const sha = crypto.createHash("sha256");
    return sha.update(s).digest('hex').slice(0, 24);
}

function getEmbedFilename(issue: IssueDigest) {
    return path.join(__dirname, `../embeds/${issue.hash}.json`);
}
