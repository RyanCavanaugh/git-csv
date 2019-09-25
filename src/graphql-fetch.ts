import path = require('path');
import fs = require('fs-extra');
import axios from "axios";
import * as IssuesQuery from './graphql-dts/issues';
import * as MoreIssueTimelineItemsQuery from './graphql-dts/moreIssueTimelineItems';

type IssueQueryResult = IssuesQuery.issues;
type Issue = IssuesQuery.issues_repository_issues_edges_node;
type TimelineItem = MoreIssueTimelineItemsQuery.moreIssueTimelineItems_repository_issue_timelineItems_edges;

const repoRoot = path.join(__dirname, "../");

async function doGraphQL(definitionFileName: string, variables: object | null): Promise<unknown> {
    const importedGqls = new Map<string, true>();

    const lines = [`# import ${definitionFileName}`];
    for (let i = 0; i < lines.length; i++) {
        const match = /^# import (.+)$/.exec(lines[i]);
        if (match !== null) {
            const importTarget = match[1];
            if (importedGqls.has(importTarget)) continue;
            importedGqls.set(importTarget, true);
            const importedContent = await fs.readFile(path.join(repoRoot, "graphql", importTarget), { encoding: "utf-8" });
            const importedLines = importedContent.split(/\r?\n/g);
            lines.splice(i, 1, ...importedLines);
            i--;
        }
    }
    const query = lines.join("\n");

    const token = await fs.readFile(path.join(repoRoot, "../api-auth-token.txt"), { encoding: "utf-8" });
    const url = `https://api.github.com/graphql`;
    const data = (variables === null) ? { query } : { query, variables };
    try {
        const result = await axios(url, {
            headers: {
                "Authorization": `bearer ${token}`,
                "User-Agent": "RyanCavanaugh/git-csv"
            },
            method: "POST",
            data
        });

        if (result.status !== 200) {
            console.error(result.statusText);
            throw new Error(result.statusText);
        }
        return result.data.data;
    } catch (e) {
        console.log(`Failed to execute against url ${url}`);
        console.log(`Data: ${JSON.stringify(data)}`);
        throw e;
    }
}

async function getRemainingIssueTimelineItems(owner: string, repoName: string, issueNumber: number, cursor: string): Promise<readonly TimelineItem[]> {
    const variables = {
        owner,
        repoName,
        issueNumber,
        cursor
    };
    const root = (await doGraphQL("more-issue-timeline-items.gql", variables)) as MoreIssueTimelineItemsQuery.moreIssueTimelineItems;
    if (!root.repository) throw "No repo";
    if (!root.repository.issue) throw "No issue";
    if (!root.repository.issue.timelineItems) throw "No issue timeline";
    if (!root.repository.issue.timelineItems.edges) throw "No issue timeline edges";

    const items: TimelineItem[] = [];
    for (const item of root.repository.issue.timelineItems.edges) {
        if (item) {
            items.push(item);
        }
    }
    if (root.repository.issue.timelineItems.pageInfo.hasNextPage) {
    if (!root.repository.issue.timelineItems.pageInfo.endCursor) throw "Have next page pointer, but no endCursor";
        const more = await getRemainingIssueTimelineItems(owner, repoName, issueNumber, root.repository.issue.timelineItems.pageInfo.endCursor);
        for (const item of more) {
            items.push(item);
        }
    }
    return items;
}

export async function queryRepoIssues(owner: string, repoName: string, states: "OPEN" | "OPEN | CLOSED", callback: (issue: Issue) => void) {
    let result: string | null = null;
    do {
        result = await again(result);
    } while (result !== null);

    async function again(cursor: string | null): Promise<string | null> {
        let issuesPerPage = 100;
        let root: IssueQueryResult | undefined = undefined;
        while (!root) {
            const variables = {
                owner,
                repoName,
                issuesPerPage,
                cursor,
                states
            };
            try {
                root = (await doGraphQL("issues.gql", variables)) as IssueQueryResult;
                break;
            } catch (e) {
                // Query timed out; reduce number of queried issues by half and try again
                issuesPerPage = Math.floor(issuesPerPage / 2);
                if (issuesPerPage === 0) {
                    throw e;
                }
            }
        }

        if (!root.repository || !root.repository.issues) throw "Something null";
        const info = root.repository.issues;
        if (!info.edges) throw "No edges"
        for (const edge of info.edges) {
            if (!edge) throw "Null edge";
            if (!edge.node) throw "Null issue";

            const issue = edge.node;

            // Fill in paginated timeline items
            if (issue.timelineItems.pageInfo.hasNextPage) {
                const remainingItems = await getRemainingIssueTimelineItems(owner, repoName, issue.number, issue.timelineItems.pageInfo.endCursor!);
                // Do not change to push(...remainingItems) - potential for stack overflow
                for (const item of remainingItems) {
                    issue.timelineItems.edges!.push({ node: item.node, __typename: item.__typename });
                    issue.timelineItems.edges![0]!.node
                }
            }

            callback(issue);
        }

        return info.pageInfo.hasNextPage ? info.pageInfo.endCursor : null;
    }
}
