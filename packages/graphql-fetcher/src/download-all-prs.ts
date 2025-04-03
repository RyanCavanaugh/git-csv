import { downloadItems } from "./download-items.js";
import { PullRequest } from "@ryancavanaugh/git-csv-graphql-io/index.js";

await downloadItems({
    owner: "microsoft",
    repoName: "TypeScript",
    issueNames: undefined,
    prNames: ["pullRequests"],
    queryFileName: "prs-by-date.gql",
    targetPathName: "all",
    force: process.argv.some(a => a === "--force"),
    schema: PullRequest
});
