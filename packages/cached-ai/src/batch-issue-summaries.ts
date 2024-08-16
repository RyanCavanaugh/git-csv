import { forEachIssue } from "@ryancavanaugh/git-csv-graphql-io/utils.js";
import { createBatcher } from "./batcher.js";
import { createCache } from "./directory-cache.js";
import { AICacheDirectory, BatchDirectory } from "@ryancavanaugh/git-csv-common";
import { getBatchLineForIssue } from "./summarize-issue.js";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

// https://platform.openai.com/docs/guides/batch/rate-limits
// Sadness: We're hitting token limits way earlier
const maxEntries = 1_000;
const maxTotalSize = 80 * 1024 * 1024;

export async function generateBatches() {
    const cache = createCache(AICacheDirectory);
    const batcher = createBatcher({
        maxEntries,
        dispatch,
        maxTotalSize
    });
    await forEachIssue("all", async item => {
        const line = getBatchLineForIssue(item);
        if (await cache.cacheFileExists(line)) {
            // Already in the batch
        } else {
            batcher.addEntry(line);
        }
    });
    batcher.done();

    async function dispatch(lines: string[], index: number) {
        await writeFile(join(BatchDirectory, `batch-${index}.jsonl`), lines.join("\n"), "utf-8");
    }
}

await generateBatches();