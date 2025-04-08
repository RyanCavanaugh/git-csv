Delete data\issue-index.json

## Setup

### Build

Build: `tsc -b`

### Fetch

### Commands You Can Run

* Download all issues/PRs from the repo: `node packages/graphql-fetcher/dist/download-all-items.js`
* Generate CSVs: `node packages/make-activity-reports/dist/cli.js`

### Issue Summarization

Steps to add AI issue summaries:

 * Create the batches: `node packages/cached-ai/dist/batch-issue-summaries.js`
 * Wait for batches to complete: `node packages/cached-ai/dist/wait-for-batch-completion.js`
 * Ingest the batch outputs: `node packages/cached-ai/dist/ingest-batch-output.js`
 