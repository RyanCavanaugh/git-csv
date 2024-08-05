import * as self from "./index.js";
import * as fs from "fs/promises";
import * as path from "path";

const testPath = "D:/github/git-csv/data/recent/microsoft/TypeScript/";

for (const test of await fs.readdir(testPath)) {
    const filePath = path.join(testPath, test);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
    const issue = self.Issue.parse(data);
}
console.log("data is validated");
