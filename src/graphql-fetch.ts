import path = require('path');
import fs = require('fs-extra');
import axios from "axios";
import { RepoIssuesResult, TimelineItemsResult } from './graphql-definitions';

const repoRoot = path.join(__dirname, "../");
const dataRoot = path.join(repoRoot, "graphql_data");
const queryDefinitions = fs.readFileSync(path.join(repoRoot, "graphql/issues.gql"), { encoding: "utf-8" });

async function doGraphQL(definitionFileName: string, variables: object | null): Promise<unknown> {
    console.clear();

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
    console.log(JSON.stringify(data, undefined, 2));
    const result = await axios(url, {
        headers: {
            "Authorization": `bearer ${token}`,
            "User-Agent": "RyanCavanaugh/git-csv"
        },
        method: "POST",
        data
    });
    console.log(JSON.stringify(result.data, undefined, 2));
    if (result.status !== 200) {
        console.error(result.statusText);
        throw new Error(result.statusText);
    }
    return result.data;
}

async function getRemainingTimelineIssues(owner: string, repoName: string, issueNumber: number, cursor: string): Promise<readonly RepoIssuesResult.TimelineItemsEdge[]> {
    const variables = {
        owner,
        repoName,
        issueNumber,
        cursor
    };
    const root = (await doGraphQL("more-timeline-items.gql", variables)) as TimelineItemsResult.Root;
    const items: RepoIssuesResult.TimelineItemsEdge[] = [];
    items.push(...root.data.repository.issue.timelineItems.edges);
    if (root.data.repository.issue.timelineItems.pageInfo.hasNextPage) {
        const more = await getRemainingTimelineIssues(owner, repoName, issueNumber, root.data.repository.issue.timelineItems.pageInfo.endCursor);
        items.push(...more);
    }
    return items;
}

async function queryRepoIssues(owner: string, repoName: string, callback: (issue: RepoIssuesResult.Issue) => void) {
    let result: string | null = null;
    do {
        result = await again(result);
    } while (result !== null);

    async function again(cursor: string | null): Promise<string | null> {
        // 100 times out, sometimes :|
        const issuesPerPage = 50;
        const variables = {
            owner,
            repoName,
            issuesPerPage,
            cursor
        };
        const root = (await doGraphQL("issues.gql", variables)) as RepoIssuesResult.Root;
    
        const info = root.data.repository.issues;
        for (const edge of info.edges) {
            const issue = edge.node;
    
            // Fill in paginated timeline items
            if (issue.timelineItems.pageInfo.hasNextPage) {
                const remainingItems = await getRemainingTimelineIssues(owner, repoName, issue.number, issue.timelineItems.pageInfo.endCursor);
                // Do not change to push(...remainingItems) - potential for stack overflow
                for (const item of remainingItems) issue.timelineItems.edges.push(item);
            }

            callback(issue);
        }

        return info.pageInfo.hasNextPage ? info.pageInfo.endCursor : null;
    }
}

queryRepoIssues("microsoft", "TypeScript", issue => {
    const targetPath = path.join(dataRoot, "microsoft", "TypeScript");
    const filename = path.join(targetPath, `${issue.number}.json`);
    fs.mkdirpSync(targetPath);
    fs.writeFileSync(filename, JSON.stringify(issue, undefined, 2), { encoding: "utf-8" });
}).then(() => {
    console.log("Done!");
});
