import { IssueOrPullRequest } from "@ryancavanaugh/git-csv-graphql-io/index.js";
import { downloadItems } from "./download-items.js";

downloadItems({
    owner: "microsoft",
    repoName: "TypeScript",
    issueNames: ["open_issues", "closed_issues"],
    prNames: ["open_prs", "closed_prs", "merged_prs"],
    queryFileName: "recently-updated.gql",
    targetPathName: "recent",
    schema: IssueOrPullRequest
});
