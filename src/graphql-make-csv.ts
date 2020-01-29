import fs = require('fs');
import path = require('path');
import csv = require('./csv');

import CSV = csv.CSV;

import * as PullRequestQuery from './graphql-dts/prs';
import * as IssuesQuery from './graphql-dts/issues';
import * as MoreIssueTimelineItemsQuery from './graphql-dts/moreIssueTimelineItems';
import * as MorePrTimelineItemsQuery from './graphql-dts/morePrTimelineItems';

type Issue = IssuesQuery.issues_repository_issues_edges_node;
type IssueTimelineItem = MoreIssueTimelineItemsQuery.moreIssueTimelineItems_repository_issue_timelineItems_edges;
type PullRequest = PullRequestQuery.prs_repository_pullRequests_edges_node;
type PullRequestTimelineItem = MorePrTimelineItemsQuery.morePrTimelineItems_repository_pullRequest_timelineItems_edges;

const dataDir = path.join(__dirname, '../graphql_data/ts-all/microsoft/TypeScript');

function timestampToDate(s: string): string {
    return new Date(s).toLocaleDateString();
}

const LabelSynonyms: { [s: string]: string } = {
    "Working as Intended": "By Design",
    "Design Limitation": "By Design",
    "Too Complex": "Declined",
    "Out of Scope": "Declined",
    "Won't Fix": "Declined",
    "Migrate-a-thon": "Docs",
    "Discussion": "Other",
    "Infrastructure": "Other"
};

// Earlier labels take priority over later labels
const LabelPriority = [
    "Duplicate",
    "Needs Investigation",
    "Bug",
    "Question",
    "By Design",
    "Misc",
    "Website Logo",
    "Design Notes",
    "External",
    "Declined",
    "Suggestion",
    "Needs More Info",
    "Docs",
    "Spec",
    "Other"
];

const BroadCategories: { [s: string]: string } = {
    "Duplicate": "Noise",
    "Bug": "Bug",
    "Question": "Noise",
    "By Design": "Noise",
    "Misc": "Other",
    "Website Logo": "Other",
    "Design Notes": "Other",
    "External": "Noise",
    "Declined": "Suggestions",
    "Suggestion": "Suggestions",
    "Needs More Info": "Unactionable",
    "Docs": "Bug",
    "Spec": "Bug",
    "Other": "Other",
    "Untriaged": "Untriaged"
}

function bestLabel(issue: Issue) {
    const realLabels = issue.labels?.edges?.map(lbl => {
        return LabelSynonyms[lbl?.node?.name!] || lbl?.node?.name!;
    }) ?? [];
    for (const lbl of LabelPriority) {
        if (realLabels.indexOf(lbl) >= 0) {
            return lbl;
        }
    }
    return issue.closed ? "External" : "Untriaged";
}

interface ActivityRecord {
    issueId: number;
    pullRequest: boolean;
    activity: string;
    actor: string;
    date: Date;
    length: number;

    thumbsUps?: number;
    thumbsDowns?: number;
}

function merge<T, U>(base: T, extras: U): T & U;
function merge(base: any, extras: any): any {
    Object.keys(base).forEach(k => extras[k] = base[k]);
    return extras;
}

function getActivityRecordsForPr(pr: PullRequest) {
    if (pr === undefined || pr.number === undefined) return [];

    const result: ActivityRecord[] = [];
    const base = {
        issueId: pr.number,
        pullRequest: true
    };

    const edges = pr.timelineItems?.edges ?? [];
    for (const item of edges) {
        if (!item?.node) continue;

        switch (item.node.__typename) {
            case "AssignedEvent":
            case "ReopenedEvent":
            case "ClosedEvent":
            case "DemilestonedEvent":
            case "MilestonedEvent":
            case "LabeledEvent":
            case "UnlabeledEvent":
                result.push({
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.node.__typename,
                    actor: item.node.actor?.login ?? "(ghost)",
                    date: new Date(item.node.createdAt),
                    length: 0
                });
                break;

            case "IssueComment":
                result.push({
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.node.__typename,
                    actor: item.node.author?.login ?? "(ghost)",
                    date: new Date(item.node.createdAt),
                    length: item.node.body.length,
                    thumbsUps: item.node.thumbsUps.totalCount,
                    thumbsDowns: item.node.thumbsDowns.totalCount
                });
                break;

            // PR stuff
            case "BaseRefChangedEvent":
            case "BaseRefForcePushedEvent":
            case "HeadRefDeletedEvent":
            case "HeadRefForcePushedEvent":
            case "HeadRefRestoredEvent":
            case "DeployedEvent":
            case "DeploymentEnvironmentChangedEvent":
            case "ReviewDismissedEvent":
            case "ReviewRequestRemovedEvent":
            case "PullRequestCommitCommentThread":
            case "ReadyForReviewEvent":
            case "PullRequestReviewThread":
            case "PullRequestRevisionMarker":
                break;

            case "ReviewRequestedEvent":
                result.push({
                    actor: item.node.actor?.login ?? "(ghost)",
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.node.__typename,
                    length: 0,
                    date: new Date(item.node.createdAt)
                });
                break;

            case "PullRequestReview":
                result.push({
                    actor: item.node.author?.login ?? "(ghost)",
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.node.__typename,
                    length: 0,
                    date: new Date(item.node.createdAt)
                });
                break;

            case "PullRequestCommit":
            case "MergedEvent":
                result.push({
                    actor: "unknown",
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.node.__typename,
                    length: 0,
                    date: new Date(0)
                    // actor: item.node.actor?.login ?? "(ghost)",
                    // date: new Date(item.node.createdAt)
                });
                break;

            case "AddedToProjectEvent":
            case "UnassignedEvent":
            case "MarkedAsDuplicateEvent":
            case "MentionedEvent":
            case "MovedColumnsInProjectEvent":
            case "ReferencedEvent":
            case "RemovedFromProjectEvent":
            case "AddedToProjectEvent":
            case "RenamedTitleEvent":
            case "CommentDeletedEvent":
            case "ConvertedNoteToIssueEvent":
            case "CrossReferencedEvent":
            case "PinnedEvent":
            case "UnpinnedEvent":
            case "LockedEvent":
            case "UnlockedEvent":
            case "UserBlockedEvent":
            case "SubscribedEvent":
            case "UnsubscribedEvent":
            case "TransferredEvent":
                break;

            default:
                return assertNever(item.node);
        }
    }

    result.push(merge(base, {
        activity: 'created',
        actor: (pr.author?.login ?? '(ghost)'),
        date: new Date(pr.createdAt),
        length: pr.body?.length ?? 0
    }));

    return result;
}

function getActivityRecordsForIssue(issue: Issue) {
    if (issue === undefined || issue.number === undefined) return [];

    const result: ActivityRecord[] = [];
    const base = {
        issueId: issue.number,
        pullRequest: false
    };

    const edges = issue.timelineItems?.edges ?? [];
    for (const item of edges) {
        if (!item?.node) continue;

        switch (item.node.__typename) {
            case "AssignedEvent":
            case "ReopenedEvent":
            case "ClosedEvent":
            case "DemilestonedEvent":
            case "MilestonedEvent":
            case "LabeledEvent":
            case "UnlabeledEvent":
                result.push({
                    issueId: issue.number,
                    pullRequest: false,
                    activity: item.node.__typename,
                    actor: item.node.actor?.login ?? "(ghost)",
                    date: new Date(item.node.createdAt),
                    length: 0
                });
                break;

            case "IssueComment":
                result.push({
                    issueId: issue.number,
                    pullRequest: false,
                    activity: item.node.__typename,
                    actor: item.node.author?.login ?? "(ghost)",
                    date: new Date(item.node.createdAt),
                    length: item.node.body.length,
                    thumbsUps: item.node.thumbsUps.totalCount,
                    thumbsDowns: item.node.thumbsDowns.totalCount
                });
                break;

            case "AddedToProjectEvent":
            case "UnassignedEvent":
            case "MarkedAsDuplicateEvent":
            case "MentionedEvent":
            case "MovedColumnsInProjectEvent":
            case "ReferencedEvent":
            case "RemovedFromProjectEvent":
            case "AddedToProjectEvent":
            case "RenamedTitleEvent":
            case "CommentDeletedEvent":
            case "ConvertedNoteToIssueEvent":
            case "CrossReferencedEvent":
            case "PinnedEvent":
            case "UnpinnedEvent":
            case "LockedEvent":
            case "UnlockedEvent":
            case "UserBlockedEvent":
            case "SubscribedEvent":
            case "UnsubscribedEvent":
            case "TransferredEvent":
                break;

            default:
                return assertNever(item.node);
        }
    }

    result.push(merge(base, {
        activity: 'created',
        actor: (issue.author?.login ?? '(ghost)'),
        date: new Date(issue.createdAt),
        length: issue.body?.length ?? 0
    }));

    return result;
}

function assertNever(n: never): never {
    throw new Error("No!");
}

function hasLabel(issue: Issue, name: string) {
    return issue.labels?.edges?.some(l => l?.node?.name === name);
}

function hasAnyLabel(issue: Issue, ...names: string[]): string | undefined {
    return names.filter(name => hasLabel(issue, name))[0];
}

function categorize(issue: Issue): [string, string] {
    if (hasLabel(issue, "Bug")) {
        return ["Bug", categorizeBug()];
    }

    if (hasLabel(issue, "Suggestion")) {
        return ["Suggestion", categorizeSuggestion()];
    }

    const noise = hasAnyLabel(issue, "Duplicate", "Working as Intended", "Design Limitation", "Needs More Info");
    if (noise) return ["Not a Bug", noise];

    const doc = hasAnyLabel(issue, "Docs", "Spec", "Website Logo");
    if (doc) return ["Documentation", doc];

    const question = hasAnyLabel(issue, "Question", "Discussion");
    if (question) return ["Questions", question];

    if (hasLabel(issue, "Needs Investigation")) return ["Untriaged", "Needs Investigation"];

    return ["Untriaged", ""];

    function categorizeBug(): string {
        if (issue.milestone) {
            return issue.milestone.title;
        }
        return "No Milestone";
    }

    function categorizeSuggestion() {
        if (hasAnyLabel(issue, "In Discussion")) return "In Discussion";
        if (hasAnyLabel(issue, "Committed", "help wanted")) return "Accepted";
        if (hasAnyLabel(issue, "Needs More Info", "Needs Proposal")) return "Needs Clarification";
        if (hasAnyLabel(issue, "Awaiting More Feedback", "Revisit")) return "Not Right Now";
        return "Unsorted";
    }
}

function getMonthCreated(i: Issue | PullRequest): string {
    const date = new Date(timestampToDate(i.createdAt));
    return getMonthOfDate(date);
}

function getMonthOfDate(date: Date): string {
    return `${date.getFullYear()}-${("0" + (1 + date.getMonth())).slice(-2)}`
}

function makeIssueReport(data: Issue[], prefix: string) {
    const issues = new CSV<Issue>();
    issues.addColumn('Issue ID', i => i.number.toString());
    issues.addColumn('Title', i => i.title);
    issues.addColumn('Month Created', i => getMonthCreated(i));
    issues.addColumn('Assigned To', i => i.assignees?.edges?.[0]?.node?.login ?? "");
    issues.addColumn('Created Date', i => timestampToDate(i.createdAt));
    issues.addColumn('Created By', i => i.author?.login ?? '(ghost)');
    issues.addColumn('Category1', i => categorize(i)[0]);
    issues.addColumn('Category2', i => categorize(i)[1]);
    // issues.addColumn('Type', i => i.pull_request ? "PR" : "Issue");
    issues.addColumn('State', i => !i.closed ? "open" : "closed");
    issues.addColumn('Category', i => BroadCategories[bestLabel(i)] || bestLabel(i));
    issues.addColumn('Milestone', i => i.milestone ? i.milestone.title : "");
    issues.addColumn('Label', i => bestLabel(i));
    issues.addColumn('Comments', i => i.timelineItems?.edges?.filter(e => e?.node?.__typename === "IssueComment").length.toString() ?? "0");
    issues.addColumn('Upvotes', issue => {
        return issue.thumbsUps.totalCount.toString();
    });

    fs.writeFileSync(`${prefix}-issues.csv`, issues.generate(data).join('\r\n'), { encoding: 'utf-8' });
}

function makePullRequestReport(data: PullRequest[], prefix: string) {
    const issues = new CSV<PullRequest>();
    issues.addColumn('ID', i => i.number.toString());
    issues.addColumn('Title', i => i.title);
    issues.addColumn('Month Created', i => getMonthCreated(i));
    issues.addColumn('Created Date', i => timestampToDate(i.createdAt));
    issues.addColumn('Created By', i => i.author?.login ?? '(ghost)');
    issues.addColumn('State', i => !i.closed ? "open" : "closed");
    issues.addColumn('Comments', i => i.timelineItems?.edges?.filter(e => e?.node?.__typename === "IssueComment").length.toString() ?? "0");

    fs.writeFileSync(`${prefix}-prs.csv`, issues.generate(data).join('\r\n'), { encoding: 'utf-8' });
}

function makeActivityReport(issues: Issue[], prs: PullRequest[], prefix: string) {
    const activities: ActivityRecord[] = [];
    issues.forEach(issue => {
        for (const act of getActivityRecordsForIssue(issue)) {
            activities.push(act);
        }
    });
    prs.forEach(pr => {
        for (const act of getActivityRecordsForPr(pr)) {
            activities.push(act);
        }
    });

    const activity = new CSV<ActivityRecord>();
    activity.addColumn('Issue ID', i => i.issueId.toString());
    activity.addColumn('Type', i => i.pullRequest ? "PR" : "Issue");
    activity.addColumn('Activity', i => i.activity || "?");
    activity.addColumn('User', i => i.actor);
    activity.addColumn('Date', i => i.date.toLocaleDateString());
    activity.addColumn('Month', i => getMonthOfDate(i.date));
    activity.addColumn('Length', i => i.length.toString());

    fs.writeFileSync(`${prefix}-activity.csv`, activity.generate(activities).join('\r\n'), { encoding: 'utf-8' });
}

function dateRangeByDay(start: Date, end: Date) {
    const result: Date[] = [];
    while (start < end) {
        result.push(start);
        start = new Date(+start + 1000 * 60 * 60 * 24);
    }
    result.push(start);
    return result;
}

/*
function makeBurndownChart(data: GitHubAPI.Issue[], milestoneList: readonly string[], predicate: (item: StoredIssue) => unknown, startDate: Date, endDate: Date, devList: readonly string[]) {
    const lines = [["Date", "Milestone", "Author", "Measure", "Value"]];

    for (const milestone of milestoneList) {

        const issues: StoredIssue[] = [];

        for (const issue of data) {
            const storedIssue = getStoredIssue(issue);
            const asOfStart = tree.unwindIssueToDate(storedIssue, startDate);
            if (asOfStart) {
                // If this issue was closed at the start of the milestone, ignore
                if (asOfStart.issue.state === "closed") continue;
            }
            if (storedIssue.issue.milestone && storedIssue.issue.milestone.title === milestone)
                if (predicate(storedIssue)) {
                    // This item needs inclusion in the report
                    issues.push(storedIssue);
                }
        }

        const bugsToDisplay: StoredIssue[] = [];
        for (const i of issues) {
            if (i.issue.labels.some(l => l.name === "Bug" || l.name === "Committed" || l.name === "Needs Investigation")) {
                bugsToDisplay.push(i);
            }
        }

        // Build up a "last known owner" map
        const days = dateRangeByDay(startDate, endDate);
        const defactoOwners = new Map<StoredIssue, string>();
        for (const issue of bugsToDisplay) {
            let setAnyOwner = false;
            for (const day of days) {
                const asOf = tree.unwindIssueToDate(issue, day);
                if (asOf && asOf.issue.assignee) {
                    defactoOwners.set(issue, asOf.issue.assignee.login);
                    setAnyOwner = true;
                }
            }
            if (!setAnyOwner) {
                console.log(`Never set an owner for ${issue.issue.number} ${issue.issue.title}`);
            }
        }

        for (const day of days) {
            for (const dev of devList) {
                let assignedCount = 0;
                let resolvedCount = 0;
                let openCount = 0;
                for (const issue of bugsToDisplay) {
                    if (defactoOwners.get(issue) === dev) {
                        assignedCount++;

                        const asOf = tree.unwindIssueToDate(issue, day);
                        if (asOf) {
                            if (asOf.issue.state === "closed") {
                                resolvedCount++;
                            } else {
                                openCount++;
                            }
                        }
                    }
                }

                lines.push([day.toLocaleDateString(), milestone, dev, "Assigned", assignedCount.toString()]);
                lines.push([day.toLocaleDateString(), milestone, dev, "Resolved", resolvedCount.toString()]);
                lines.push([day.toLocaleDateString(), milestone, dev, "Open", openCount.toString()]);
            }
        }
    }

    fs.writeFileSync("burndown.csv", lines.map(line => line.join(",")).join("\r\n"), { encoding: "utf-8" });
}
*/

export function runReport(dataDir: string, prefix: string) {
    const issues: Issue[] = read(path.join(dataDir, "issue"));
    const prs: PullRequest[] = read(path.join(dataDir, "pr"));

    if (issues.length > 0) {
        console.log("Making issue report");
        makeIssueReport(issues, prefix);
    }
    if (prs.length > 0) {
        console.log("Making PR report");
        makePullRequestReport(prs, prefix);
    }
    console.log("Making activity report");
    makeActivityReport(issues, prs, prefix);

    function read(directory: string) {
        const result: any[] = [];
        if (fs.existsSync(directory)) {
            for (const fn of fs.readdirSync(directory)) {
                result.push(JSON.parse(fs.readFileSync(path.join(directory, fn), { encoding: "utf-8" })));
            }
        }
        return result;
    }
}

// Burndown chart logic
/*

Every burndown chart has a report start and end date.
For each dev-day pair, we get three numbers:
 * Total assigned
 * Open
 * Resolved
Total assigned === Open + Resolved

An issue is "assigned" to a dev if it was assigned to at any point during the report period
and is currently closed, or is assigned to them now and still open.
An issue is "resolved" if it's currently closed.
"Open" is by definition the remainder.
*/
