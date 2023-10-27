import * as fs from 'fs/promises';
import * as PullRequestQuery from './graphql-dts/prs.js';
import * as IssuesQuery from './graphql-dts/issues.js';
import * as MoreIssueTimelineItemsQuery from './graphql-dts/moreIssueTimelineItems.js';
import * as MorePrTimelineItemsQuery from './graphql-dts/morePrTimelineItems.js';
import * as url from 'url';
import * as path from 'path';
import { query } from './graphql-query.js';
import { sleep } from './utils.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const queriesRoot = path.join(__dirname, "../queries");

type Issue = IssuesQuery.issues_repository_issues_edges_node;
type IssueQueryResult = IssuesQuery.issues;
type IssueTimelineItem = MoreIssueTimelineItemsQuery.moreIssueTimelineItems_repository_issue_timelineItems_edges;
type PullRequest = PullRequestQuery.prs_repository_pullRequests_edges_node;
type PullRequestQueryResult = PullRequestQuery.prs;
type PullRequestTimelineItem = MorePrTimelineItemsQuery.morePrTimelineItems_repository_pullRequest_timelineItems_edges;

async function getRemainingItemTimelineItems(kind: ItemKind, owner: string, repoName: string, itemNumber: number, cursor: string): Promise<readonly (IssueTimelineItem | PullRequestTimelineItem)[]> {
    const variables = {
        owner,
        repoName,
        itemNumber,
        cursor
    };
    const queryName = kind === "pr" ? "more-pr-timeline-items.gql" : "more-issue-timeline-items.gql"
    let root = (await query(queryName, variables)) as (MoreIssueTimelineItemsQuery.moreIssueTimelineItems | MorePrTimelineItemsQuery.morePrTimelineItems);
    let edges;
    let pageInfo;
    if (kind === "pr") {
        const info = root as MorePrTimelineItemsQuery.morePrTimelineItems;
        if (!info.repository) throw "No repo";
        if (!info.repository.pullRequest) throw "No PR";
        if (!info.repository.pullRequest.timelineItems) throw "No timeline";
        if (!info.repository.pullRequest.timelineItems.edges) throw "No edges";
        edges = info.repository.pullRequest.timelineItems.edges;
        pageInfo = info.repository.pullRequest.timelineItems.pageInfo;
    } else {
        const info = root as MoreIssueTimelineItemsQuery.moreIssueTimelineItems;
        if (!info.repository) throw "No repo";
        if (!info.repository.issue) throw "No PR";
        if (!info.repository.issue.timelineItems) throw "No timeline";
        if (!info.repository.issue.timelineItems.edges) throw "No edges";
        edges = info.repository.issue.timelineItems.edges;
        pageInfo = info.repository.issue.timelineItems.pageInfo;
    }

    const items: (IssueTimelineItem | PullRequestTimelineItem)[] = [];
    for (const item of edges) {
        if (item) {
            items.push(item);
        }
    }

    if (pageInfo.hasNextPage) {
        if (!pageInfo.endCursor) throw "Have next page pointer, but no endCursor";
        const more = await getRemainingItemTimelineItems(kind, owner, repoName, itemNumber, pageInfo.endCursor);
        for (const item of more) {
            items.push(item);
        }
    }
    return items;
}

export type ItemKind = "pr" | "issue";
export async function queryRepoIssuesOrPullRequests(kind: ItemKind, owner: string, repoName: string, states: "OPEN" | "CLOSED" | "MERGED", callback: (item: Issue | PullRequest) => void) {
    console.log(`Fetching ${states} ${kind}s from ${owner}/${repoName}...`);

    const queryName = kind === "pr" ? "prs.gql" : "issues.gql";
    let nextCursor: string | null = null;
    let queryCount = 0;
    let itemCount = 0;
    do {
        nextCursor = await again(nextCursor);
        queryCount++;
        if (queryCount === 10) {
            queryCount = 0;
            console.log(`${itemCount} items fetched`);
        }
    } while (nextCursor !== null);

    async function again(cursor: string | null): Promise<string | null> {
        let itemsPerPage = 50;
        let root: PullRequestQueryResult | IssueQueryResult | undefined = undefined;
        while (!root) {
            const variables = {
                owner,
                repoName,
                itemsPerPage,
                cursor,
                states
            };
            try {
                root = (await query(queryName, variables)) as IssueQueryResult | PullRequestQueryResult;
                break;
            } catch (e: any) {
                if (e.response && e.response.status === 403) {
                    // Abuse detection; back off
                    console.log("Backing off from abuse detection");
                    await sleep(60 * 1000);
                    continue;
                }
    
                // Query timed out; reduce number of queried items by half and try again
                itemsPerPage = Math.floor(itemsPerPage / 2);
                console.log(`Query failed (code ${e.response && e.response.status}). Trying again with fewer items (${itemsPerPage})`);
                if (itemsPerPage === 0) {
                    if (e.response) {
                        console.log(`  data: ${JSON.stringify(e.response.data, undefined, 2)}`);
                        console.log(`  status: ${e.response.status}`);
                        console.log(`  headers: ${JSON.stringify(e.response.headers, undefined, 2)}`);
                    }
                    debugger;
                    throw e;
                }
            }
        }

        let edges;
        let pageInfo;
        if (kind === "pr") {
            const info = (root as PullRequestQueryResult).repository;
            if (!info) throw "Repo null";
            if (!info.pullRequests) throw "PRs null";
            if (!info.pullRequests.edges) throw "Edges null";
            edges = info.pullRequests.edges;
            pageInfo = info.pullRequests.pageInfo;
        } else {
            const info = (root as IssueQueryResult).repository;
            if (!info) throw "Repo null";
            if (!info.issues) throw "PRs null";
            if (!info.issues.edges) throw "Edges null";
            edges = info.issues.edges;
            pageInfo = info.issues.pageInfo;
        }

        for (const edge of edges) {
            if (!edge) throw "Null edge";
            if (!edge.node) throw "Null issue";

            const item = edge.node;

            // Fill in paginated timeline items
            if (item.timelineItems.pageInfo.hasNextPage) {
                console.log(`Fetch extra items from timeline for #${item.number}`);
                const remainingItems = await getRemainingItemTimelineItems(kind, owner, repoName, item.number, item.timelineItems.pageInfo.endCursor!);
                // Do not change to push(...remainingItems) - potential for stack overflow
                for (const timelineItem of remainingItems) {
                    if (kind === "pr") {
                        const prTimelineItem = timelineItem as PullRequestTimelineItem;
                        (item.timelineItems.edges as PullRequestTimelineItem[]).push({ node: prTimelineItem.node, __typename: prTimelineItem.__typename });
                    } else {
                        const issueTimelineItem = timelineItem as IssueTimelineItem;
                        (item.timelineItems.edges as IssueTimelineItem[]).push({ node: issueTimelineItem.node, __typename: issueTimelineItem.__typename });
                    }
                }
            }

            itemCount++;
            callback(item);
        }

        return pageInfo.hasNextPage ? pageInfo.endCursor : null;
    }
}
