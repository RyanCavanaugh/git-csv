import fs = require('fs-extra');
import path = require('path');
import rmrf = require('rimraf');
import { reactReport } from "./graphql-treeage";

const repoRoot = path.join(__dirname, "../");
const dataRoot = path.join(repoRoot, "graphql_data/open_issues/");

const report = reactReport(dataRoot);
fs.writeFileSync(path.join(repoRoot, "report.html"), report, { encoding: "utf-8" });
console.log("Done!");
