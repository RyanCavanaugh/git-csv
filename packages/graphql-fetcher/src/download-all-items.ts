import { downloadItems } from "./download-items.js";

await downloadItems({
    owner: "microsoft",
    repoName: "TypeScript",
    issueNames: ["issues"],
    prNames: undefined,
    queryFileName: "issues-by-date.gql",
    targetPathName: "all"
});

await downloadItems({
    owner: "microsoft",
    repoName: "TypeScript",
    issueNames: undefined,
    prNames: ["pullRequests"],
    queryFileName: "prs-by-date.gql",
    targetPathName: "all"
});
