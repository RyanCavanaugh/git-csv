import { DataDirectory } from "@ryancavanaugh/git-csv-common";
import { query } from "./graphql-query.js";
import { mkdir, readFile, writeFile } from "fs/promises";
import { fetchSingleIssue } from "./fetch-single-issue.js";
import { fetchSinglePr } from "./fetch-single-pr.js";
import { join } from "path";

await getRecentItems("microsoft", "TypeScript");

export async function getRecentItems(owner: string, repoName: string) {
    const targetPath = join(DataDirectory, "recent", owner, repoName);
    await mkdir(targetPath, { recursive: true });

    const queryParams = { owner, repoName };
    const root: any = await query("recently-updated.gql", queryParams);
    const repo = root.repository;

    for (const state of ["open_prs", "closed_prs", "merged_prs"]) {
        console.log(state);
        await runCycle(repo[state].nodes, fetchSinglePr);
    }

    for (const state of ["open_issues", "closed_issues"]) {
        console.log(state);
        await runCycle(repo[state].nodes, fetchSingleIssue);
    }

    async function runCycle(list: ReadonlyArray<{ number: number, updatedAt: string }>, download: (typeof fetchSingleIssue) | (typeof fetchSinglePr)) {
        for (const item of list) {
            const targetFilePath = join(targetPath, `${item.number}.json`);
            let updatedAt: string | null = null;
            try {
                const extant = await readFile(targetFilePath, "utf-8");
                updatedAt = JSON.parse(extant).updatedAt;
            } catch { }
            if (item.updatedAt === updatedAt) {
                console.log(`Up-to-date as of ${updatedAt}`);
                break;
            }
            const content = await download(owner, repoName, item.number.toString());
            writeFile(targetFilePath, JSON.stringify(content, undefined, 2));
        }
    }
}
