import { query } from "./graphql-query.js";
import { PullRequest } from "@ryancavanaugh/git-csv-graphql-io/index.js";

export async function fetchSinglePr(owner: string, repoName: string, prNumber: string) {
    const queryParams = { owner, repoName, prNumber: +prNumber };
    const root: any = await query("single-pr.gql", queryParams);

    const prRoot = root.repository?.pullRequest;

    if (prRoot.timelineItems.pageInfo.hasNextPage) {
        let cursor = prRoot.timelineItems.pageInfo.endCursor;
        while (true) {
            console.log("Fetch more timeline items for PR " + prNumber);
            const pageParams = { ...queryParams, cursor };
            const moreItems: any = await query("more-pr-timeline-items.gql", pageParams);
            prRoot.timelineItems.nodes.push(...moreItems.repository.pullRequest.timelineItems.nodes);
            if (!moreItems.repository.pullRequest.timelineItems.pageInfo.hasNextPage) break;
            cursor = moreItems.repository.pullRequest.timelineItems.pageInfo.endCursor;
        }
    }

    try {
        PullRequest.parse(prRoot);
    } catch (e) {
        debugger;
        console.log(`Error fetching ${owner}/${repoName}#${prNumber}`);
        console.log(e);
        process.stdin.read(1);
    }

    return prRoot;
}
