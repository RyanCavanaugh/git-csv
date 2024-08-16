import { readdir, unlink } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { BatchDirectory } from "@ryancavanaugh/git-csv-common";
import openai, { OpenAI } from "openai";

export type Result = "done" | "waiting";
export async function processMoreBatches(): Promise<Result> {
    const client = new openai();

    const unprocessedFiles = await readdir(BatchDirectory);

    // Fetch all batches
    const batchList: OpenAI.Batch[] = [];
    let page = await client.batches.list();
    while (true) {
        batchList.push(...page.data);
        if (page.hasNextPage()) {
            page = await page.getNextPage();
        } else {
            break;
        }
    }

    // If anything is in progress, don't do anything
    const running = batchList.find(b => isRunning(b.status));
    if (running !== undefined) {
        console.log(`Batch ${running.id} is still running`);
        return "waiting"
    }

    // Upload a file, if we have any.
    if (unprocessedFiles.length === 0) {
        console.log(`No files remain for upload! All processing is complete.`);
        return "done";
    }

    const fileName = join(BatchDirectory, unprocessedFiles[0]);
    const file = await client.files.create({
        file: createReadStream(fileName),
        purpose: "batch"
    });
    console.log(`Uploaded ${unprocessedFiles[0]} for processing; deleting local copy.`);
    await unlink(fileName);

    const batch = await client.batches.create({
        completion_window: "24h",
        endpoint: "/v1/chat/completions",
        input_file_id: file.id
    });
    console.log(`Started batch ${batch.id}!`);
    return "waiting";
}

function isRunning(s: openai.Batch["status"]) {
    switch (s) {
        case "cancelled":
        case "completed":
        case "expired":
        case "failed":
            return false;
        case "cancelling":
        case "finalizing":
        case "in_progress":
        case "validating":
            return true;
        default:
            s satisfies never;
    }
}