import fs = require("fs");
import path = require("path");
import csv = require("./csv");
import gq = require("./graphql-loader");
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

function createTriager() {
    const root = create<gq.Issue>().describe("All");

    const reportSections = {
        bugs: [] as string[],
        untriaged: [] as string[],
        mislabelled: [] as string[],
        pendingSuggestions: [] as string[],
        untriagedSuggestions: [] as string[],
        needsSuggestionLabel: [] as string[],
        noise: [] as string[]
    };

    root.catch((item, err) => {
        reportSections.mislabelled.push(...[
            ` * ${nonLinkingReference(item.number, item.title)}`,
            ...err.predicates.map(pred =>
                `   * ${pred.description || pred.toString()}`
            )
        ]);
    });

    root.addPath(isClosed).describe("Closed");
    const open = root.otherwise().describe("Open");
    root.addTerminalAction(throwImpossible);

    open.addPath(isPullRequest).describe("PRs");
    const issue = open.otherwise().describe("Open Issues");

    issue.addPath(hasLabel("Bug")).describe("Bugs").addAlwaysAction(item => {
        addReportListItem(item, reportSections.bugs);
    });

    const suggestionPendingLabels = ["Needs Proposal", "Awaiting More Feedback", "Needs More Info"];
    const suggestion = issue.addPath(hasLabel("Suggestion")).describe("Suggestions");
    const docket = suggestion.addPath(hasLabel("In Discussion")).describe("In Discussion");
    suggestion.addPath(hasAnyLabel(...suggestionPendingLabels)).describe("Pending").addAlwaysAction((item) => {
        addReportListItem(item, reportSections.pendingSuggestions);
    });
    suggestion.otherwise().describe("Untriaged Suggestion").addAlwaysAction((item) => {
        addReportListItem(item, reportSections.untriagedSuggestions);
    });

    issue.addPath(hasLabel("Needs Investigation"));

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

    const noise = create<gq.Issue>().describe("Noise");
    const noiseLabels = ["Question", "Working as Intended", "Design Limitation", "Duplicate", "By Design"];
    noiseLabels.forEach(label => noise.addPath(hasLabel(label)));
    issue.addPathTo(noise.groupingPredicate, noise);
    noise.addAlwaysAction(item => {
        addReportListItem(item, reportSections.noise);
    });

    issue.addPath(hasLabel("External"));

    issue.addPath(needsMoreInfoButNotSuggestion);

    const untriaged = issue.otherwise().describe("Untriaged");
    untriaged.addPath(hasAnyLabel("Needs Proposal", "In Discussion")).addAlwaysAction(item => {
        addReportListItem(item, reportSections.needsSuggestionLabel);
    });
    untriaged.addTerminalAction(item => {
        addReportListItem(item, reportSections.untriaged);
    });

    return { root, reportSections };
}

function createReportTriager() {
    const opts: NodeOptions = { pathMode: "first" };
    const root = create<gq.Issue>(opts).describe("All");

    root.addPath(isPullRequest);

    // Noise issues don't care about open/closed
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

function runReport() {
    const { root, reportSections } = createTriager();

    const fileNames = fs.readdirSync(dataRoot);
    for (const fn of fileNames) {
        if (fn === "issue-index.json") continue;
        const issue = gq.loadIssueFromFileContent(JSON.parse(fs.readFileSync(path.join(dataRoot, fn), { encoding: "utf-8" })));
        debugger;
        root.process(issue);
    }

    fs.writeFileSync("viz.txt", visualizeNodeTree(root), { encoding: "utf-8" });

    const reportLines: string[] = [];
    for (const k of Object.keys(reportSections)) {
        const list = (reportSections as any)[k];
        reportLines.push(` ## ${k} (${list.length})`);
        reportLines.push(...list);
        reportLines.push("");
    }
    fs.writeFileSync("report.md", reportLines.join("\r\n"), { encoding: "utf-8" });
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
