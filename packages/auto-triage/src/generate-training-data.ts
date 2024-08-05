import * as fs from "fs/promises";
import * as path from "path";

const authors = ["RyanCavanaugh", "MartinJohns"];
const toTrainOnLabels = ["Duplicate", "Working as Intended", "Not a Defect", "Question"];

const trainingData: object[] = [];

const template = {
    "messages": [
        { "role": "system", "content": "Vera is an experienced TypeScript developer who triages issues on GitHub. She is helpful and kind, but also extremely to-the-point. Her goal in all situations is to either identify a good bug, briefly explain to the user why they're mistaken, or point to a duplicate issue." },
        { "role": "user", "content": "What's the capital of France?" },
        { "role": "assistant", "content": "Paris, as if everyone doesn't know that already." }
    ]
};

const root = `../../graphql_data/ts-all/microsoft/TypeScript/issue`;

const files = await fs.readdir(root);
files.reverse();
for (const file of files) {
    const issue = JSON.parse(await fs.readFile(path.join(root, file), 'utf-8'));
    if (issue.number < 30000) continue;
    if (!issue.labels.edges.some((label: any) => toTrainOnLabels.includes(label.node.name))) continue;

    let datum = JSON.parse(JSON.stringify(template));
    for (const { node } of issue.timelineItems.edges) {
        if (!node) continue;
        if (node.__typename === "IssueComment" && authors.includes(node.author?.login)) {
            // console.log(node.body);
            datum.messages[1].content = issue.body;
            datum.messages[2].content = node.body;
            if (issue.body.length < 2000 && node.body.length < 3000)
            trainingData.push(datum);
            break;
        }
    }
    if (trainingData.length > 600) break;
}

const lines = trainingData.map(obj => JSON.stringify(obj));
fs.writeFile("training-data.jsonl", lines.slice(0, 400).join("\n"), "utf-8");
fs.writeFile("validation-data.jsonl", lines.slice(400).join("\n"), "utf-8");
