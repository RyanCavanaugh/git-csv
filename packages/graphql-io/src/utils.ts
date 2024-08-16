import { IssueOrPullRequest, Issue, PullRequest } from "./index.js";
import { join } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { PredefinedDirectories } from "@ryancavanaugh/git-csv-common";

export async function forEachIssue(dataRootName: keyof typeof PredefinedDirectories, callback: (item: Issue, fileName: string) => unknown) {
    await forEachItemRaw(dataRootName, async (json, fileName) => {
        const url = (json as any).url;
        if (url.indexOf("/issues") !== -1) {
            try {
                const issue = Issue.parse(json);
                await callback(issue, fileName);
            } catch (e) {
                console.log(`Error parsing ${fileName}`);
                console.log(e);
            }
        }
    });
}

export async function forEachPullRequest(dataRootName: keyof typeof PredefinedDirectories, callback: (item: PullRequest, fileName: string) => unknown) {
    await forEachItemRaw(dataRootName, async (json, fileName) => {
        const url = (json as any).url;
        if (url.indexOf("/issues") === -1) {
            try {
                const pr = PullRequest.parse(json);
                await callback(pr, fileName);
            } catch (e) {
                console.log(`Error parsing ${fileName}`);
                console.log(e);
            }
        }
    });
}

export async function forEachIssueOrPullRequest(dataRootName: keyof typeof PredefinedDirectories, callback: (item: IssueOrPullRequest, fileName: string) => unknown) {
    await forEachItemRaw(dataRootName, async (json, fileName) => {
        try {
            const item = IssueOrPullRequest.parse(json);
            await callback(item, fileName);
        } catch (e) {
            console.log(`Error parsing ${fileName}`);
            console.log(e);
        }
    });
}


export async function forEachItemRaw(dataRootName: keyof typeof PredefinedDirectories, callback: (item: object, fileName: string) => unknown) {
    const root = PredefinedDirectories[dataRootName];
    const ownerNames = await readdir(root);
    for (const ownerName of ownerNames) {
        const repoNames = await readdir(join(root, ownerName));
        for (const repoName of repoNames) {
            const repoRoot = join(root, ownerName, repoName)
            const fileNames = await readdir(repoRoot);
            for (const name of fileNames) {
                const path = join(repoRoot, name);
                const fileContent = await readFile(path, "utf-8");
                const json = JSON.parse(fileContent);
                await callback(json, path);
            }
        }
    }
}
