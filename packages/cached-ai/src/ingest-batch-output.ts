import openai from "openai";
import { BatchInputLine, BatchResponseLine } from "./batch-output-format.js";
import { IssueSummary } from "./summarize-issue.js";
import { createCache } from "./directory-cache.js";
import { AICacheDirectory } from "@ryancavanaugh/git-csv-common";

console.log("Ingesting batches...");
const client = new openai();
const files = await getAllFiles();
const cache = createCache(AICacheDirectory);
console.log(`Catalogued ${files.length} files.`);

let page = await client.batches.list();
while (true) {
    for (const batch of page.data) {
        if (batch.completed_at === undefined) {
            console.log(`Batch ${batch.id} has not completed.`);
            continue;
        }
        if (batch.output_file_id === undefined) {
            console.log(`Batch ${batch.id} is completed but has no output file (???).`);
            continue;
        }

        if (files.every(f => f.id !== batch.input_file_id)) {
            console.log(`Batch ${batch.id}'s input file has been deleted, skipping.`);
            continue;
        }

        console.log(`Downloading input and output files...`);
        const inputFile = await client.files.content(batch.input_file_id);
        const outputFile = await client.files.content(batch.output_file_id);
        const inputFileContent = await inputFile.text();
        const outputFileContent = await outputFile.text();
        console.log(`Batch ${batch.id}: ${inputFileContent.length} input bytes, ${outputFileContent.length} output bytes`);
        const inputLines = contentLinesToParsedJson(inputFileContent);
        const outputLines = contentLinesToParsedJson(outputFileContent);

        const inputs = getMap(inputLines, obj => BatchInputLine.parse(obj));
        const outputs = getMap(outputLines, obj => BatchResponseLine.parse(obj));
        let inputTokenCount = 0;
        let outputTokenCount = 0;
        for (const [key, output] of outputs) {
            inputTokenCount += output.response.body.usage.prompt_tokens;
            outputTokenCount += output.response.body.usage.completion_tokens;
            // Get corresponding input
            const input = inputs.get(key);
            if (input === undefined) {
                console.log(`Unexpected: No corresponding input key for ${key}`);
                continue;
            }
            const outputContent = output.response.body.choices[0].message.content;
            // Check that the output was valid
            try {
                IssueSummary.parse(JSON.parse(outputContent));
            } catch (e) {
                console.log(`Unexpected parsing error on ${key}`);
                console.log(e);
                continue;
            }
            
            await cache.writeCacheFile(JSON.stringify(input), outputContent);
        }
        console.log(`Batch of ${inputs.size} consumed ${inputTokenCount} input tokens, ${outputTokenCount} output tokens`);
    }
    if (!page.hasNextPage()) break;
    page = await page.getNextPage();
}

function getMap<T extends { custom_id: string }>(objects: object[], parse: (input: object) => T): Map<string, T> {
    const result = new Map<string, T>();
    for (const obj of objects) {
        const parsed = parse(obj);
        result.set(parsed.custom_id, parsed);
    }
    return result;
}

function contentLinesToParsedJson(content: string): object[] {
    return content.split('\n').map(s => s.trim()).filter(s => s.length > 0).map(line => JSON.parse(line));
}

async function getAllFiles() {
    const files: openai.FileObject[] = [];
    let page = await client.files.list();
    while (true) {
        files.push(...page.data);
        if (page.hasNextPage()) {
            page = await page.getNextPage()
        } else {
            break;
        }
    }
    return files;
}
