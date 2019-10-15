import * as fetchTasks from "./fetch-tasks";

process.on('unhandledRejection', (error: any) => {
    console.log(error.message);
});

const tasks = [
    ["fetch-dt-open", fetchTasks.dt_open],
    ["fetch-dt-all-prs", fetchTasks.dt_all_prs],
    ["fetch-ts-open", fetchTasks.ts_open_issues],
    ["fetch-ts-all", fetchTasks.ts_all],
    ["fetch-ts-test", fetchTasks.ts_test]
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
