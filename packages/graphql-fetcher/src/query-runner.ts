import * as path from "path";
import * as fs from "fs/promises";
import * as fetch from "./index.js";
import { DataDirectory } from "@ryancavanaugh/git-csv-common";

export async function runQuery(queryName: string, owner: string, repoName: string, kind: "issue" | "pr" | "both", state: "OPEN" | "CLOSED" | "MERGED" | "ALL") {
    console.log(`Running query: ${queryName} (${owner}/${repoName} ${state} ${kind}s)`);

    const stagingName = queryName + "-staging";
    const stagingPath = path.join(DataDirectory, stagingName);
    await fs.rm(stagingPath, { recursive: true, force: true });

    const actualStates = state === "ALL" ? ["OPEN", "CLOSED", "MERGED"] as const : [state] as const;

    if (kind === "both") {
        for (const state of actualStates) {
            if (state !== "MERGED") {
                await fetch.queryRepoIssuesOrPullRequests("issue", owner, repoName, state, async item => {
                    await writeItem("issue", item);
                });
            }
            await fetch.queryRepoIssuesOrPullRequests("pr", owner, repoName, state, async item => {
                await writeItem("pr", item);
            });
        }
    } else {
        for (const state of actualStates) {
            await fetch.queryRepoIssuesOrPullRequests(kind, owner, repoName, state, async item => {
                await writeItem(kind, item);
            });
        }
    }

    const targetPath = path.join(DataDirectory, queryName);
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.rename(stagingPath, targetPath);

    async function writeItem(kind: string, item: { number: number }) {
        const targetPath = path.join(stagingPath, owner, repoName, kind);
        const filename = path.join(targetPath, `${item.number}.json`);
        await fs.mkdir(targetPath, { recursive: true });
        await fs.writeFile(filename, JSON.stringify(item, undefined, 2), { encoding: "utf-8" })
    }
}
