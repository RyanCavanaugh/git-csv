import { parseArgs } from "node:util";
import { fetchSingleIssue } from "./fetch-single-issue.js";
import { writeFile } from "node:fs/promises";
import { fetchSinglePr } from "./fetch-single-pr.js";

const options = {
    pr: {
        type: "string",
        default: ""
    },
    issue: {
        type: "string",
        default: ""
    }
} as const;

const args = process.argv.slice(2);
const { values } = parseArgs({ options, args });

if (values.issue) {
    const ref = parseRef(values.issue);
    const item = await fetchSingleIssue(ref.owner, ref.repo, ref.number);
    console.log(JSON.stringify(item, undefined, 2));
}

if (values.pr) {
    const ref = parseRef(values.pr);
    const item = await fetchSinglePr(ref.owner, ref.repo, ref.number);
    console.log(JSON.stringify(item, undefined, 2));
}

function parseRef(s: string) {
    const regex = /^(\w+)\/(\w+)#(\d+)$/;
    const match = regex.exec(s);
    if (match === null) {
        throw new Error(`Item reference ${s} didn't match pattern 'owner/repo#number'`);
    }
    return ({
        owner: match[1],
        repo: match[2],
        number: match[3]
    });
}