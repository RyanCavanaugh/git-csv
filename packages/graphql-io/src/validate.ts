import * as self from "./index.js";
import * as fs from "fs/promises";
import * as path from "path";
import { PathReporter } from "io-ts/lib/PathReporter.js";
import { isLeft } from "fp-ts/lib/Either.js";

const testPath = "D:/github/git-csv/data/recent/microsoft/TypeScript/";

for (const test of await fs.readdir(testPath)) {
    const filePath = path.join(testPath, test);
    const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
    const issue = self.Issue.decode(data);
    if (isLeft(issue)) {
        console.log(filePath);
        throw Error(
            `Could not validate data: ${PathReporter.report(issue).join("\n")}`
        );
    }
}
console.log("data is validated");