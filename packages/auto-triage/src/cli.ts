import { Issue } from '@ryancavanaugh/git-csv-graphql-io/index.js';
import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs/promises';
import { processIssue } from './analyze-issue-and-comments.js';

async function main() {
    const program = new Command();

    interface Options {
        issue: string;
    }
    program
        .option('--issue [number]', 'Specify the issue number to analyze');

    program.parse(process.argv);

    const options: Options = program.opts();

    if (options.issue) {
        console.log(`Analyzing #${options.issue}`);
        const issuePath = path.join(import.meta.dirname, '../../../data/recent/microsoft/TypeScript', `${options.issue}.json`);
        const issue = Issue.parse(JSON.parse(await fs.readFile(issuePath, "utf-8")));
        console.log(`#${options.issue}: ${issue.title}`);
        await processIssue(issue);
    } else {
        console.log('No issue number provided.');
    }
}

main();