import { makeIssueReport, makeActivityReport, makePrReport } from "./make-csv.js";

await makePrReport();
await makeIssueReport();
await makeActivityReport();
