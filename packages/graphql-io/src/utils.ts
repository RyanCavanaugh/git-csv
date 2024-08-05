import { Issue } from "./index.js";
import { join } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { PredefinedDirectories } from "@ryancavanaugh/git-csv-common";

export async function forEachIssue(dataRootName: keyof typeof PredefinedDirectories, callback: (item: Issue) => void) {
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
                if (json.url.indexOf("/issues") !== -1) {
                    try {
                        const issue = Issue.parse(json);
                        callback(issue);
                    } catch (e) {
                        console.log(`Error parsing ${name}`);
                        console.log(e);
                    }
                }
            }
        }
    }
}
