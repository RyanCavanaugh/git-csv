import * as path from 'node:path';
import { createTable } from './csv.js';
import type * as Types from "@ryancavanaugh/git-csv-graphql-io/index.js";
import { forEachIssue, forEachIssueOrPullRequest, forEachPullRequest } from '@ryancavanaugh/git-csv-graphql-io/utils.js';
import { ReportDirectory } from "@ryancavanaugh/git-csv-common"
import * as ai from "@ryancavanaugh/git-csv-cached-ai";

const Usernames = {
    Team: ["RyanCavanaugh", "weswigham", "gabritto", "sandersn", "rbuckton", "iisaduan", "navya9singh", "jakebailey", "andrewbranch", "sheetalkamat", "ahejlsberg"]
}

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

function bestLabel(issue: Types.Issue) {
    const realLabels = issue.labels?.nodes.map(lbl => {
        return LabelSynonyms[lbl?.name!] || lbl?.name!;
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

function getActivityRecordsForPr(pr: Types.PullRequest) {
    if (pr === undefined || pr.number === undefined) return [];

    const result: ActivityRecord[] = [];
    const base = {
        issueId: pr.number,
        pullRequest: true
    };

    const edges = pr.timelineItems.nodes;
    for (const item of edges) {
        if (item === null) continue;
        switch (item.__typename) {
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
                    activity: item.__typename,
                    actor: item.actor?.login ?? "(ghost)",
                    date: new Date(item.createdAt),
                    length: 0
                });
                break;

            case "IssueComment":
                result.push({
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.__typename,
                    actor: item.author?.login ?? "(ghost)",
                    date: new Date(item.createdAt),
                    length: item.body.length,
                    thumbsUps: item.reactionGroups.filter(r => r.content === "THUMBS_UP")[0]?.reactors?.totalCount ?? 0,
                    thumbsDowns: item.reactionGroups.filter(r => r.content === "THUMBS_DOWN")[0]?.reactors?.totalCount ?? 0
                });
                break;

            case "PullRequestReview":
                result.push({
                    actor: item.author?.login ?? "(ghost)",
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.__typename,
                    length: 0,
                    date: new Date(item.createdAt)
                });
                break;

/*
            case "ReviewRequestedEvent":
                result.push({
                    actor: item.actor?.login ?? "(ghost)",
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.__typename,
                    length: 0,
                    date: new Date(item.createdAt)
                });
                break;


            case "PullRequestCommit":
            case "MergedEvent":
                result.push({
                    actor: "unknown",
                    issueId: pr.number,
                    pullRequest: true,
                    activity: item.__typename,
                    length: 0,
                    date: new Date(0)
                    // actor: item.node.actor?.login ?? "(ghost)",
                    // date: new Date(item.node.createdAt)
                });
                break;
*/
            /*

            case "UnassignedEvent":
            case "MarkedAsDuplicateEvent":
            case "MentionedEvent":
            case "ReferencedEvent":
            case "RenamedTitleEvent":
            case "CommentDeletedEvent":
            case "CrossReferencedEvent":
            case "LockedEvent":
            case "UnlockedEvent":
            case "SubscribedEvent":
            case "UnsubscribedEvent":
                break;

            default:
                return assertNever(item.__typename);
                */
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

function getActivityRecordsForIssue(issueOrPr: Types.IssueOrPullRequest) {
    const result: ActivityRecord[] = [];
    const base = {
        issueId: issueOrPr.number,
        pullRequest: false
    };

    const edges = issueOrPr.timelineItems.nodes ?? [];
    for (const item of edges) {
        if (item === null) continue;

        switch (item.__typename) {
            case "AssignedEvent":
            case "ReopenedEvent":
            case "ClosedEvent":
            case "DemilestonedEvent":
            case "MilestonedEvent":
            case "LabeledEvent":
            case "UnlabeledEvent":
                result.push({
                    issueId: issueOrPr.number,
                    pullRequest: false,
                    activity: item.__typename,
                    actor: item.actor?.login ?? "(ghost)",
                    date: new Date(item.createdAt),
                    length: 0
                });
                break;

            case "IssueComment":
                result.push({
                    issueId: issueOrPr.number,
                    pullRequest: false,
                    activity: item.__typename,
                    actor: item.author?.login ?? "(ghost)",
                    date: new Date(item.createdAt),
                    length: item.body.length,
                    thumbsUps: item.reactionGroups.filter(r => r.content === "THUMBS_UP")[0]?.reactors?.totalCount ?? 0,
                    thumbsDowns: item.reactionGroups.filter(r => r.content === "THUMBS_DOWN")[0]?.reactors?.totalCount ?? 0
                });
                break;
        }
    }

    result.push(merge(base, {
        activity: 'created',
        actor: (issueOrPr.author?.login ?? '(ghost)'),
        date: new Date(issueOrPr.createdAt),
        length: issueOrPr.body?.length ?? 0
    }));

    return result;
}

function assertNever(n: never): never {
    throw new Error("No! " + JSON.stringify(n));
}

function hasLabel(issue: Types.Issue, name: string) {
    return issue.labels?.nodes.some(l => l?.name === name);
}

function hasAnyLabel(issue: Types.Issue, ...names: string[]): string | undefined {
    return names.filter(name => hasLabel(issue, name))[0];
}

function categorize(issue: Types.Issue): [string, string] {
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

function getMonthCreated(i: Types.Issue | Types.PullRequest): string {
    const date = new Date(timestampToDate(i.createdAt));
    return getMonthOfDate(date);
}

function getMonthOfDate(date: Date): string {
    return `${date.getFullYear()}-${("0" + (1 + date.getMonth())).slice(-2)}`
}

export async function makeIssueReport() {
    const issues = createTable<Types.Issue>();
    issues.addColumn('Issue ID', i => i.number.toString());
    issues.addColumn('Title', i => i.title);
    issues.addColumn('Month Created', i => getMonthCreated(i));
    issues.addColumn('Assigned To', i => i.assignees.nodes[0]?.login ?? "");
    issues.addColumn('Created Date', i => timestampToDate(i.createdAt));
    issues.addColumn('Created By', i => i.author?.login ?? '(ghost)');
    issues.addColumn('Category1', i => categorize(i)[0]);
    issues.addColumn('Category2', i => categorize(i)[1]);
    // issues.addColumn('Type', i => i.pull_request ? "PR" : "Issue");
    issues.addColumn('State', i => !i.closed ? "open" : "closed");
    issues.addColumn('Category', i => BroadCategories[bestLabel(i)] || bestLabel(i));
    issues.addColumn('Milestone', i => i.milestone ? i.milestone.title : "");
    issues.addColumn('Label', i => bestLabel(i));
    issues.addColumn('Tone', async i => ((await ai.tryGetIssueSummary(i))?.tone.toString()) ?? "");
    issues.addColumn('Clarity', async i => ((await ai.tryGetIssueSummary(i))?.clarity.toString()) ?? "");
    issues.addColumn('Summary', async i => ((await ai.tryGetIssueSummary(i))?.summary)?? "");
    issues.addColumn('Domain', async i => ((await ai.tryGetIssueSummary(i))?.domain) ?? "");
    issues.addColumn('Severity', async i => ((await ai.tryGetIssueSummary(i))?.severity) ?? "");
    issues.addColumn('Comments', i => i.timelineItems.nodes.filter(e => e?.__typename === "IssueComment").length.toString() ?? "0");

    await forEachIssue("all", issue => issues.processItem(issue));
    await issues.writeToFile(path.join(ReportDirectory, "all-issues.csv"));
}

export async function makeActivityReport() {
    const activity = createTable<ActivityRecord>();
    activity.addColumn('Issue ID', i => i.issueId.toString());
    activity.addColumn('Type', i => i.pullRequest ? "PR" : "Issue");
    activity.addColumn('Activity', i => i.activity || "?");
    activity.addColumn('User', i => i.actor);
    activity.addColumn('Date', i => i.date.toLocaleDateString());
    activity.addColumn('Month', i => getMonthOfDate(i.date));
    activity.addColumn('Length', i => i.length.toString());
    await forEachIssue("all", item => {
        const activities = getActivityRecordsForIssue(item);
        activities.forEach(a => activity.processItem(a));
    });
    await forEachPullRequest("all", pr => {
        const activities = getActivityRecordsForPr(pr);
        activities.forEach(a => activity.processItem(a));
    });
    await activity.writeToFile(path.join(ReportDirectory, "all-activity.csv"));
}

export async function makePrReport() {
    const prs = createTable<Types.PullRequest>();
    prs.addColumn('PR ID', i => i.number.toString());
    prs.addColumn('Title', i => i.title);
    prs.addColumn('Month Created', i => getMonthCreated(i));
    prs.addColumn('Assigned To', i => i.assignees.nodes[0]?.login ?? "");
    prs.addColumn('Created Date', i => timestampToDate(i.createdAt));
    prs.addColumn('Created By', i => i.author?.login ?? '(ghost)');
    prs.addColumn('State', i => !i.closed ? "open" : "closed");
    prs.addColumn('Comments', i => i.timelineItems.nodes.filter(e => e?.__typename === "IssueComment").length.toString() ?? "0");

    await forEachPullRequest("all", pr => prs.processItem(pr));
    await prs.writeToFile(path.join(ReportDirectory, "all-prs.csv"));
}
