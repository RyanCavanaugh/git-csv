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

export function makeIssueTrainingData() {
    const issues: Issue[] = read(path.join(dataDir, "issue"));

    const text: string[] = [];

    for (const issue of issues) {
        text.push(`[startOfInput]`);
        text.push(`# ${issue.title}`);
        text.push(`# ${issue.body}`);
        text.push(`[responses]`);
        for (const e of issue.timelineItems?.edges ?? []) {
            const n = e?.node;
            if (!n) continue;
            switch(n.__typename) {
                case "LabeledEvent":
                    text.push(`Add label ${n.label.name}`);
                    break;
                case "IssueComment":
                    text.push(`${n.body}`);
                    break;
            }
        }
        text.push(`[endOfInput]`);
    }

    fs.writeFileSync(`training-data.txt`, text.map(s => s.substr(0, 1024)).join('\r\n'), { encoding: 'utf-8' });

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
