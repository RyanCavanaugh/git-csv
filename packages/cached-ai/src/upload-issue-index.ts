import { forEachIssue } from "@ryancavanaugh/git-csv-graphql-io/utils.js";
import { tryGetIssueSummary } from "./index.js";
import { writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import type { Issue } from "@ryancavanaugh/git-csv-graphql-io/index.js";
import { ReportDirectory } from "@ryancavanaugh/git-csv-common";
import OpenAI from "openai";

const openai = new OpenAI();

const vectorStoreId = 'vs_O39zPZ2n8Gj04nZ9v2X8DwNo';

const maintainerNames = ["RyanCavanaugh", "andrewbranch", "MartinJohns", "mhegazy", "ahejlsberg", "DanielRosenwasser"];

const lines: object[] = [];
await forEachIssue("all", async item => {
    const summary = await tryGetIssueSummary(item);

    const line = {
        number: `#${item.number}`,
        title: item.title,
        body: item.body.substring(0, 16384),
        summary: summary?.summary ?? "",
        description: summary?.description ?? "",
        maintainer_comment: getMaintainerComment(item)
    } satisfies Record<string, {}>;
    lines.push(line);
});

await writeFile(join(ReportDirectory, `issue-index.json`), JSON.stringify(lines, undefined, 2), "utf-8");

const fileIds: string[] = [];
let count = 1;
while (lines.length > 0) {
    const section = lines.splice(0, 500);

    const fileName = join(ReportDirectory, `issue-index-part-${count}.json`);
    await writeFile(fileName, JSON.stringify(section, undefined, 2), "utf-8");

    const file = await openai.files.create({
        file: createReadStream(fileName),
        purpose: "assistants",
    });
    fileIds.push(file.id);

    count++;
}
console.log(`Uploaded ${fileIds.length} files. Creating batch`);
const batch = await openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
    file_ids: fileIds
});
console.log(`Created batch ${batch.id}`);

function getMaintainerComment(issue: Issue) {
    if (issue.labels.nodes.some(node => node?.name === "Bug")) return "This is a bug";

    for (const item of issue.timelineItems.nodes) {
        if (!item) continue;
        if (item.__typename === "IssueComment") {
            if (maintainerNames.includes(item.author?.login!)) {
                return item.body.substring(0, 8192);
            }
        }
    }

    return "";
}
