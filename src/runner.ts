import path = require("path");
import * as fetchTasks from "./fetch-tasks";
import * as graphql_makeCsv from "./graphql-make-csv";

process.on('unhandledRejection', (error: any) => {
    console.log(error.message);
});

const tasks = [
    ["fetch-dt-open", fetchTasks.dt_open],
    ["fetch-dt-all-prs", fetchTasks.dt_all_prs],
    ["fetch-ts-open", fetchTasks.ts_open_issues],
    ["fetch-ts-all", fetchTasks.ts_all],
    ["fetch-ts-test", fetchTasks.ts_test],
    ["csv-ts-open", async () => {
        graphql_makeCsv.runReport(path.join(__dirname, '../graphql_data/ts-open-issues/Microsoft/TypeScript'), "ts-open-issues");
    }],
    ["csv-ts-all", async () => {
        graphql_makeCsv.runReport(path.join(__dirname, '../graphql_data/ts-all/Microsoft/TypeScript'), "ts-all");
    }]

] as const;

let ok = false;
for (const t of tasks) {
    if (t[0] === process.argv[2]) {
        ok = true;
        t[1]().then(() => {
            console.log("Done!");
        });
    }
}
if (!ok) {
    for (const t of tasks) {
        console.log(t[0]);
    }
}
