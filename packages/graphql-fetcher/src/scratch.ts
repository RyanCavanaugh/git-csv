import { query } from "./graphql-query.js";

const data = await query("single-issue.gql", { owner: "microsoft", repoName: "TypeScript", issueNumber: 202 });