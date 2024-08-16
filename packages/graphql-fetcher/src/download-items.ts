import { DataDirectory } from "@ryancavanaugh/git-csv-common";
import { query } from "./graphql-query.js";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { fetchSingleIssue } from "./fetch-single-issue.js";
import { fetchSinglePr } from "./fetch-single-pr.js";
import { join } from "path";
import { sleepUntil } from "./utils.js";

export type DownloadInfo = {
    owner: string;
    repoName: string;
    queryFileName: string;
    targetPathName: string;
    prNames: undefined | readonly string[];
    issueNames: undefined | readonly string[];
}

export async function downloadItems(opts: DownloadInfo) {
    const deadLetterPath = "deadletter.txt";
    const { owner, repoName, queryFileName, targetPathName, prNames, issueNames } = opts;

    const targetPath = join(DataDirectory, targetPathName, owner, repoName);
    await mkdir(targetPath, { recursive: true });

    let cursor: string | null;
    try {
        cursor = await readFile(deadLetterPath, "utf-8");
    } catch {
        cursor = null;
    }
    do {
        const queryParams = { owner, repoName, cursor };
        const root: any = await query(queryFileName, queryParams);
        const repo = root.repository;

        cursor = null;
        for (const kinds of [prNames ?? [], issueNames ?? []]) {
            for (const state of kinds) {
                const page = repo[state];
                await runCycle(page.nodes, kinds === prNames ? fetchSinglePr : fetchSingleIssue);
                if (page.pageInfo?.hasNextPage) {
                    cursor = page.pageInfo.endCursor;
                }
            }
            if (root.rateLimit?.remaining < 200) {
                console.log(`Need to rest for a bit! ${root.rateLimit.resetAt}`);
                const resetAt = new Date(root.rateLimit.resetAt);
                await sleepUntil(resetAt);
            }
            if (cursor !== null) {
                console.log(`Paginating, rate limit at ${root.rateLimit?.remaining}`);
                await writeFile(deadLetterPath, cursor);
            }
        }
    } while (cursor !== null);
    console.log("Done; unlinking deadletter");
    await unlink(deadLetterPath);

    async function runCycle(list: ReadonlyArray<{ number: number, updatedAt: string }>, download: (typeof fetchSingleIssue) | (typeof fetchSinglePr)) {
        for (const item of list) {
            const targetFilePath = join(targetPath, `${item.number}.json`);
            let updatedAt: string | null = null;
            try {
                const extant = await readFile(targetFilePath, "utf-8");
                updatedAt = JSON.parse(extant).updatedAt;
            } catch { }

            if (item.updatedAt === updatedAt) {
                console.log(`${item.number} is already current`);
            } else {
                const content = await download(owner, repoName, item.number.toString());
                writeFile(targetFilePath, JSON.stringify(content, undefined, 2));
            }
        }
    }
}
