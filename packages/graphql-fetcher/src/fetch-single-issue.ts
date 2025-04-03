import { query } from "./graphql-query.js";
import { Issue } from "@ryancavanaugh/git-csv-graphql-io/index.js";

export async function fetchSingleIssue(owner: string, repoName: string, issueNumber: string): Promise<object> {
    const queryParams = { owner, repoName, issueNumber: +issueNumber };
    const root: any = await query("single-issue.gql", queryParams);

    const issueRoot = root.repository?.issue;
   
    if (issueRoot.timelineItems.pageInfo.hasNextPage) {
        let cursor = issueRoot.timelineItems.pageInfo.endCursor;
        while (true) {
            console.log("Fetch more timeline items for " + issueNumber);
            const pageParams = { ...queryParams, cursor };
            const moreItems: any = await query("more-issue-timeline-items.gql", pageParams);
            issueRoot.timelineItems.nodes.push(...moreItems.repository.issue.timelineItems.nodes);
            if (!moreItems.repository.issue.timelineItems.pageInfo.hasNextPage) break;
            cursor = moreItems.repository.issue.timelineItems.pageInfo.endCursor;
        }
    }

    try {
        Issue.parse(issueRoot);
    } catch (e) {
        debugger;
        console.log(`Error fetching ${owner}/${repoName}#${issueNumber}`);
        console.log(e);
        process.stdin.read(1);
    }

    return issueRoot;
}
