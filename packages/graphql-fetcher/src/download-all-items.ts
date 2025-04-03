import { downloadItems } from "./download-items.js";
import { Issue, PullRequest } from "@ryancavanaugh/git-csv-graphql-io/index.js";

await downloadItems({
    owner: "microsoft",
    repoName: "TypeScript",
    issueNames: ["issues"],
    prNames: undefined,
    queryFileName: "issues-by-date.gql",
    targetPathName: "all",
    schema: Issue
});

await downloadItems({
    owner: "microsoft",
    repoName: "TypeScript",
    issueNames: undefined,
    prNames: ["pullRequests"],
    queryFileName: "prs-by-date.gql",
    targetPathName: "all",
    schema: PullRequest
});
