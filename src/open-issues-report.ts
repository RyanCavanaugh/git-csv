import fs = require('fs-extra');
import path = require('path');
import rmrf = require('rimraf');
import { queryRepoIssues } from "./graphql-fetch";
import { reactReport } from "./graphql-treeage";

const repoRoot = path.join(__dirname, "../");
const dataRoot = path.join(repoRoot, "graphql_data/open_issues/");

rmrf(dataRoot, () => {
    queryRepoIssues("microsoft", "TypeScript", issue => {
        const targetPath = path.join(dataRoot, "microsoft", "TypeScript");
        const filename = path.join(targetPath, `${issue.number}.json`);
        fs.mkdirpSync(targetPath);
        fs.writeFileSync(filename, JSON.stringify(issue, undefined, 2), { encoding: "utf-8" });
    }).then(() => {
        const report = reactReport(dataRoot);
        fs.writeFileSync(path.join(repoRoot, "report.html"), report, { encoding: "utf-8" });
        console.log("Done!");
    });
});
