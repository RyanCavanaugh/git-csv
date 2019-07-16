import fs = require("fs");
import path = require("path");
import csv = require("./csv");
import gq = require("./graphql-loader");
import _ = require("lodash");
import { Predicate, create, NodeOptions, visualizeNodeTree } from "./treeage-core";

import CSV = csv.CSV;

const dataRoot = path.join(__dirname, "../graphql_data/microsoft/TypeScript");

function hasLabel(name: string): Predicate<gq.Issue> {
    function hasLabelImpl(item: gq.Issue) {
        return item.labels.some((i: gq.Label) => i.name === name);
    }
    hasLabelImpl.description = `[${name}]`;

    return hasLabelImpl;
}

function hasAnyLabel(...names: string[]): Predicate<gq.Issue> {
    function hasAnyLabelImpl(item: gq.Issue) {
        for (const name of names) {
            for (const lab of item.labels) {
                if (lab.name === name) return true;
            }
        }
        return false;
    }

    hasAnyLabelImpl.description = `${names.join(' or ')}`;
    return hasAnyLabelImpl;
}

function never() {
    return false;
}
never.description = "(not reachable)";

function isUnlabelled(issue: gq.Issue) {
    return issue.labels.length === 0;
}
isUnlabelled.description = "Unlabelled";

function isOpen(issue: gq.Issue) {
    return !issue.closed;
}
isOpen.description = "Open";

function isClosed(issue: gq.Issue) {
    return issue.closed;
}
isClosed.description = "Closed";

function unmilestoned(issue: gq.Issue) {
    return issue.milestone === null;
}
unmilestoned.description = "Not in a milestone";

function inMilestone(name: string) {
    const impl = function (issue: gq.Issue) {
        return issue.milestone !== null && issue.milestone.title === name;
    };
    return impl;
}

function throwImpossible() {
    debugger;
    throw new Error("Should not be able to reach this tree point");
}
throwImpossible.description = "(assert)";

function isPullRequest(issue: gq.Issue) {
    return false;
    // return !!issue.pull_request;
}
isPullRequest.description = "Pull Request";

function needsMoreInfoButNotSuggestion(item: gq.Issue) {
    return hasLabel("Needs More Info")(item) && !hasLabel("Suggestion")(item);
}
needsMoreInfoButNotSuggestion.description = "Needs More Info but not Suggestion";

/**
 * Create a markdown link to an issue in a way that GitHub won't create a "referenced" backlink
 */
function nonLinkingReference(issueNumber: string | number, title: string) {
    return `[#${issueNumber} ${title}](https://github.com/Microsoft/TypeScript/${enc("issues")}/${issueNumber})`;
    function enc(s: string) {
        return s.split("").map(c => "%" + c.charCodeAt(0).toString(16)).join("");
    }
}

function addReportListItem(issue: any, target: string[]) {
    target.push(` * ${nonLinkingReference(issue.number, issue.title)}`);
}

function isLabelSynonymFor(oldName: string, currentName: string) {
    if (oldName === currentName) return true;
    switch (currentName) {
        case "help wanted":
            return oldName === "Accepting PRs";
    }
    return false;
}

export function unwindIssueToDate(issue: gq.Issue, date: Date): gq.Issue | undefined {
    // Hasn't been born yet
    if (issue.createdAt > date) return undefined;

    // Last event date is not in the future; we can skip doing any work
    if (issue.timelineItems.every(e => new Date(e.createdAt) <= date)) {
        return issue;
    }

    // Clone this to avoid mutation
    issue = JSON.parse(JSON.stringify(issue));

    // For each thing that occurred after the specified date, attempt to undo it
    const eventTimeline = issue.timelineItems.slice().reverse();
    for (const event of eventTimeline) {
        if (new Date(event.createdAt) > date) {
            // Remove the event so we can maybe re-use this object
            issue.timelineItems.splice(issue.timelineItems.indexOf(event), 1);
            switch (event.type) {
                case "ClosedEvent":
                    issue.closed = false;
                    break;
                case "ReopenedEvent":
                    issue.closed = true;
                    break;
                case "LabeledEvent":
                    const match = issue.labels.filter(l => l.id === event.label.id)[0];
                    if (match !== undefined) {
                        issue.labels.splice(issue.labels.indexOf(match), 1);
                    } else {
                        // If the label that was added has since been deleted,
                        // it won't appear in the current list.
                    }
                    break;
                case "UnlabeledEvent":
                    issue.labels.push({ ...event.label });
                    break;
                case "LockedEvent":
                    issue.locked = false;
                    break;
                case "UnlockedEvent":
                    issue.locked = true;
                    break;
                case "AssignedEvent":
                case "UnassignedEvent":
                case "MilestonedEvent":
                case "DemilestonedEvent":
                case "LockedEvent":
                case "UnlockedEvent":
                case "IssueComment":
                    // Nothing to do / don't care yet
                    break;

                default:
                    assertNever(event);
            }
        }
    }
    return issue;
}

function createOpenIssueTriager() {
    const root = create<gq.Issue>().describe("All");

    const mislabelled: [gq.Issue, any][] = [];

    // If any issue is labelled incorrectly, it'll be processed here
    root.catch((item, err) => {
        mislabelled.push([
            item, err
        ]);
    });

    const closed = root.addPath(isClosed).describe("Closed");
    const open = root.otherwise().describe("Open");
    root.addTerminalAction(throwImpossible);

    const pullRequests = open.addPath(isPullRequest).describe("PRs");

    const issue = open.otherwise().describe("Open Issues");

    const needsInvestigation = issue.addPath(hasLabel("Needs Investigation"));
    const bugs = issue.addPath(hasLabel("Bug"));

    const noMilestoneBugs = bugs.addPath(unmilestoned);
    const backlogBugs = bugs.addPath(inMilestone("Backlog"));

    const suggestion = issue.addPath(hasLabel("Suggestion"));
    const docket = suggestion.addPath(hasLabel("In Discussion"));
    const amf = suggestion.addPath(hasLabel("Awaiting More Feedback"));
    const needsInfo = suggestion.addPath(hasAnyLabel("Needs Proposal", "Needs More Info"));
    const unsortedSuggestions = suggestion.otherwise().describe("Untriaged Suggestion");

    const meta = create<gq.Issue>().describe("Meta, Infra, & Notes");
    meta.addPath(hasLabel("Meta-Issue"));
    meta.addPath(hasLabel("Infrastructure"));
    meta.addPath(hasLabel("Design Notes"));
    meta.addPath(hasLabel("Discussion"));
    meta.addPath(hasLabel("Planning"));
    issue.addPathTo(meta.groupingPredicate, meta);

    const docs = create<gq.Issue>().describe("Docs & Website");
    docs.addPath(hasLabel("Website"));
    docs.addPath(hasLabel("Website Logo"));
    docs.addPath(hasLabel("Spec"));
    docs.addPath(hasLabel("Docs"));
    issue.addPathTo(docs.groupingPredicate, docs);

    const noise = issue.addPath(hasAnyLabel("Question", "Working as Intended", "Design Limitation", "Duplicate", "By Design", "External")).describe("Noise");

    issue.addPath(needsMoreInfoButNotSuggestion);

    const missingSuggestionLabel = issue.addPath(i => hasAnyLabel("Needs Proposal", "In Discussion")(i) && !hasLabel("Suggestion")(i));

    const untriaged = issue.otherwise().describe("Untriaged");

    const reportItems = {
        bugs,
        backlogBugs,
        noMilestoneBugs,
        pullRequests,
        closed,
        open,
        noise,
        missingSuggestionLabel,
        needsInvestigation,
        untriaged,
        docket,
        amf,
        needsInfo,
        unsortedSuggestions
    };
    const lists: { [K in keyof typeof reportItems]: gq.Issue[] } = {} as any;

    for (const k of Object.keys(reportItems) as (keyof typeof reportItems)[]) {
        reportItems[k].addTerminalAction(item => {
            lists[k] = lists[k] || [];
            lists[k].push(item);
        })
    }

    return ({
        root,
        categories: lists,
        reportItems,
        mislabelled
    });
}

function createReportTriager() {
    const opts: NodeOptions = { pathMode: "first" };
    const root = create<gq.Issue>(opts).describe("All");

    root.addPath(isPullRequest);

    // Noise issues don't care about open/closed state
    const noise = create<gq.Issue>(opts).describe("Noise");
    for (const lbl of ["Duplicate", "By Design", "Working as Intended", "Design Limitation", "Question", "External", "Unactionable", "Won't Fix"]) {
        noise.addPath(hasLabel(lbl));
    }
    root.addPathTo(noise.groupingPredicate, noise);

    // Bugs -> assign into open/closed
    const bugs = root.addPath(hasLabel("Bug"));
    bugs.addPath(isClosed);
    bugs.addPath(isOpen);

    // Suggestions
    const suggestions = create<gq.Issue>(opts).describe("Suggestions");
    for (const lbl of ["Suggestion", "In Discussion"]) {
        suggestions.addPath(hasLabel(lbl));
    }
    root.addPathTo(suggestions.groupingPredicate, suggestions);

    // Misc
    const misc = create<gq.Issue>(opts).describe("Misc");
    for (const lbl of ["Docs", "Website Logo", "Spec", "Website"]) {
        misc.addPath(hasLabel(lbl));
    }
    root.addPathTo(misc.groupingPredicate, misc);

    // Meta (i.e. should be untracked)
    const meta = create<gq.Issue>(opts).describe("Meta");
    for (const lbl of ["Design Notes", "Planning", "Infrastructure", "Discussion", "Breaking Change", "Fixed"]) {
        meta.addPath(hasLabel(lbl));
    }
    root.addPathTo(meta.groupingPredicate, meta);

    const unactionable = create<gq.Issue>(opts).describe("Unactionable");
    for (const lbl of ["Needs More Info", "Needs Proposal"]) {
        unactionable.addPath(hasLabel(lbl));
    }
    root.addPathTo(unactionable.groupingPredicate, unactionable);

    // Unlabelled / NI / NMI
    root.addPath(isUnlabelled);
    root.addPath(hasLabel("VS Code Tracked"));
    root.addPath(hasLabel("Needs Investigation"));

    // ???
    root.addPath(() => true).describe("Other").addAlwaysAction(a => {
        // console.log("#" + a.issue.number + " - " + a.issue.title);
    });

    return root;
}

function groupBy<T>(arr: readonly T[], sel: (item: T) => string): [string, T[]][] {
    const groups: [string, T[]][] = [];
    for (const item of arr) {
        const g = sel(item);
        const existing = groups.filter(gr => gr[0] === g)[0];
        if (existing) {
            existing[1].push(item);
        } else {
            groups.push([g, [item]]);
        }
    }
    return groups;
}

function runReport() {
    const { root, categories, mislabelled } = createOpenIssueTriager();

    const fileNames = fs.readdirSync(dataRoot);
    const allIssues: gq.Issue[] = [];
    for (const fn of fileNames) {
        const fileContent = fs.readFileSync(path.join(dataRoot, fn), { encoding: "utf-8" });
        const issue = gq.loadIssueFromFileContent(JSON.parse(fileContent));
        allIssues.push(issue);
        root.process(issue);
    }

    fs.writeFileSync("viz.txt", visualizeNodeTree(root), { encoding: "utf-8" });

    const reportLines: string[] = [];

    reportLines.push("# Needs Attention");

    reportSection(categories.untriaged, "Untriaged", "These issues need to be investigated and labelled");
    reportSection(mislabelled.map(m => m[0]), "Mislabelled", "These have incorrect label sets applied to them");
    reportSection(categories.noMilestoneBugs, "Unmilestoned Bugs", "These bugs need to be put into a milestone");
    reportSection(categories.bugs.filter(b => b.assignees.length === 0), "Unassigned Bugs", "These bugs need an assignee");

    reportLines.push("# Scheduled Bug Fixes");
    reportLines.push("");
    reportLines.push("## Milestone / Assignee Breakdown");
    reportLines.push("");
    reportLines.push("This table includes all issues, not just bugs.");
    reportLines.push("");
    table(allIssues.filter(b => !b.closed && b.milestone !== null), issue => issue.milestone!.title, issue => issue.assignees[0] ? issue.assignees[0].login : "(no one)", "Assignee");
    reportLines.push("");

    
    reportLines.push("These bugs have been assigned to a developer in an upcoming milestone");
    reportLines.push("");

    const bugsByMilestone = groupBy(categories.bugs.filter(b => b.milestone !== null && b.assignees.length > 0), item => item.milestone!.title);
    bugsByMilestone.sort((a, b) => b[0] > a[0] ? -1 : 1);
    for (const milestone of bugsByMilestone) {
        reportSection(milestone[1], milestone[0], "");
    }    

    reportLines.push("# Backlog");

    reportSection(categories.backlogBugs, "Bug Backlog", "These bugs are in the backlog milestone, sorted by 👍s", (i1, i2) => i2.thumbsUps - i1.thumbsUps);
    reportSection(categories.needsInvestigation, "Needs Investigation", "These issues need to be investigated to determine next steps", (i1, i2) => i2.thumbsUps - i1.thumbsUps);

    reportLines.push("# Suggestion");

    reportSection(categories.unsortedSuggestions, "Unsorted Issues", "These need a sub-label", (i1, i2) => i2.thumbsUps - i1.thumbsUps);
    reportSection(categories.amf, "Awaiting More Feedback", "Suggestions we're collecting support for", (i1, i2) => i2.thumbsUps - i1.thumbsUps);
    reportSection(categories.docket, "In Discussion", "Suggestions that need review for possible inclusion", (i1, i2) => i2.thumbsUps - i1.thumbsUps);
    
    fs.writeFileSync("report.md", reportLines.join("\r\n"), { encoding: "utf-8" });

    function table(issues: readonly gq.Issue[], columnSelector: (i: gq.Issue) => string, rowSelector: (i: gq.Issue) => string, origin: string) {
        const columnValues = issues.map(columnSelector);
        const rowValues = issues.map(rowSelector);
        const columns = _.uniq(columnValues);
        const rows = _.uniq(rowValues);
        reportLines.push(`|${origin} | ${columns.join(' | ')}|`);
        reportLines.push(`|----------|${columns.map(() => '------').join('|')}|`);
        for (const row of rows) {
            let line = `|${row}`
            for (let col = 0; col < columns.length; col++) {
                let count = 0;
                for (let i = 0; i < columnValues.length; i++) {
                    if (rowValues[i] === row && columnValues[i] === columns[col]) count++;
                }
                line = line + '|' + count;
            }
            reportLines.push(line + '|');
        }
    }

    function reportSection(issues: readonly gq.Issue[], header: string, description: string, sortFunc?: (i1: gq.Issue, i2: gq.Issue) => number, listFunc?: (issue: gq.Issue) => string) {
        if (issues === undefined) return;
        const issueList = [...issues];
        issueList.sort(sortFunc || ((i1, i2) => i2.number - i1.number));
        reportLines.push(` ## ${header} (${issues.length})`);
        reportLines.push("");
        reportLines.push(description);
        reportLines.push("");
        if (issues.length === 0) {
            reportLines.push("(No issues are in this state)");
        } else {
            if (issues.length > 20) {
                reportLines.push(`<details>`);
                reportLines.push("");
                reportLines.push(`<summary>Complete list of ${issues.length} issues</summary>`);
                reportLines.push("");
                for (const item of issueList) {
                    reportLines.push(` * ${(listFunc || defaultLister)(item)}`)
                }
                reportLines.push(`</details>`);
            } else {
                for (const item of issueList) {
                    reportLines.push(` * ${(listFunc || defaultLister)(item)}`)
                }
            }
        }
        reportLines.push("");
    }

    function defaultLister(issue: gq.Issue) {
        return nonLinkingReference(issue.number, issue.title);
    }
}

function getReportDates(): Date[] {
    const result: Date[] = [];
    let startDate = new Date("1/1/2015");
    while (startDate < new Date()) {
        result.push(startDate);
        startDate = new Date(+startDate + 1000 * 60 * 60 * 24 * 7);
    }
    return result;
}

function runHistoricalReport() {
    const dates = getReportDates();
    const rows = dates.map(date => ({
        date,
        triager: createReportTriager()
    }));

    const fileNames = fs.readdirSync(dataRoot);
    fileNames.sort();

    let processCount = 0;
    rows.reverse();
    for (const fn of fileNames) {
        processCount++;

        if (fn === "issue-index.json") continue;
        let issue = JSON.parse(fs.readFileSync(path.join(dataRoot, fn), { encoding: "utf-8" }));
        for (const row of rows) {
            issue = unwindIssueToDate(issue, row.date);
            if (issue === undefined) break;
            row.triager.process(issue);
        }

        if (processCount % 1000 === 0) console.log(processCount);
    }
    rows.reverse();

    /* TODO what was this code doing??
    const colNodes = getAllParentedNodes(rows[0].triager);
    const columns = colNodes.map(node => node[1]);
    const report = [];
    report.push(["date", ...columns].join(","));
    for (const row of rows) {
        const nodes = getAllParentedNodes(row.triager);
        const cells = nodes.map(node => node[0].hitCount);
        const csv = [row.date.toLocaleDateString(), ...cells].join(",");
        report.push(csv);
    }
    fs.writeFileSync("historical-report.csv", report.join("\r\n"), { encoding: "utf-8" });
    */
}

// runHistoricalReport();

runReport();

function assertNever(x: never) {
    throw new Error(`Impossible value ${x} observed`);
}
