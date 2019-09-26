import fs = require('fs-extra');
import path = require('path');
import rmrf = require('rimraf');
import * as fetch from "./graphql-fetch";

const repoRoot = path.join(__dirname, "../");
const dataRoot = path.join(repoRoot, "graphql_data/");

export async function runQuery(queryName: string, owner: string, repoName: string, kind: "issue" | "pr" | "both", state: "OPEN" | "CLOSED" | "MERGED" | "ALL") {
    console.log(`Running query: ${queryName} (${owner}/${repoName} ${state} ${kind}s)`);

    const stagingName = queryName + "-staging";
    const stagingPath = path.join(dataRoot, stagingName);
    if (fs.existsSync(stagingPath)) {
        await fs.remove(stagingPath);
    }

    const actualStates = state === "ALL" ? ["OPEN", "CLOSED", "MERGED"] as const: [state] as const;

    if (kind === "both") {
        for (const state of actualStates) {
            if (state !== "MERGED") {
                await fetch.queryRepoIssuesOrPullRequests("issue", owner, repoName, state, item => {
                    writeItem("issue", item);
                });
            }
            await fetch.queryRepoIssuesOrPullRequests("pr", owner, repoName, state, item => {
                writeItem("pr", item);
            });
        }
    } else {
        for (const state of actualStates) {
            await fetch.queryRepoIssuesOrPullRequests(kind, owner, repoName, state, item => {
                writeItem(kind, item);
            });
        }
    }

    const targetPath = path.join(dataRoot, queryName);
    await fs.remove(targetPath);
    await fs.rename(stagingPath, targetPath);

    async function writeItem(kind: string, item: { number: number }) {
        const targetPath = path.join(stagingPath, owner, repoName, kind);
        const filename = path.join(targetPath, `${item.number}.json`);
        await fs.mkdirp(targetPath);
        fs.writeFile(filename, JSON.stringify(item, undefined, 2), { encoding: "utf-8" })
    }
}

export async function dt_open() {
    await runQuery("dt-open-prs", "DefinitelyTyped", "DefinitelyTyped", "pr", "OPEN");
}

export async function ts_open_issues() {
    await runQuery("ts-open-issues", "microsoft", "TypeScript", "issue", "OPEN");
}

export async function ts_all() {
    await runQuery("ts-all", "microsoft", "TypeScript", "both", "ALL");
}
