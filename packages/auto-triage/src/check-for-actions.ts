import type { Issue } from "@ryancavanaugh/git-csv-graphql-io/index.js";
import { forEachIssue } from "@ryancavanaugh/git-csv-graphql-io/utils.js";

interface ActionKinds {
    lock: "super-stale" | "fixed-and-stale";
    giveUp: "no-info-provided";
}

type MakeAction<K, R extends string> = { kind: K; reason: R };
type GetActions<T extends keyof ActionKinds> = T extends unknown ? MakeAction<T, ActionKinds[T]> : never;
type Action = GetActions<keyof ActionKinds>;

function getActionForIssue(issue: Issue): Action | undefined {
    if (issue.closed) {
        return getActionForClosedIssue(issue);
    } else {
        return getActionForOpenIssue(issue);
    }
}

function getActionForClosedIssue(issue: Issue): Action | undefined {
    // Already locked, nothing to do
    if (issue.locked) return;

    // Not a bug
    const isBug = issue.labels.nodes.some(n => n?.name === "Bug");
    if (!isBug) return;

    const updatedAt = new Date(issue.updatedAt);
    const isFixed = issue.labels.nodes.some(n => n?.name === "Fixed") || issue.closedByPullRequestsReferences.nodes.length;
    const isVeryStale = isOlderThan(updatedAt, { years: 2 });
    const isStale = isOlderThan(updatedAt, { months: 6 });
    if (isFixed && isStale) {
        return { kind: "lock", reason: "fixed-and-stale" };
    }
    if (isVeryStale) {
        return { kind: "lock", reason: "super-stale" };
    }
    return;
}

function getActionForOpenIssue(issue: Issue): Action | undefined {
    // Dormant milestone, ignore
    if (issue.milestone?.title === "Dormant") return;

    return;
}

function isOlderThan(date: Date, obj: { years?: number, months?: number }) {
    const ms = (obj.months ?? 0) * 28 * 24 * 60 * 60 * 1000 +
                (obj.years ?? 0) * 525600 * 60 * 60 * 1000;
    const now = +(new Date());
    return (+date) < (now - ms);
}

forEachIssue("all", issue => {
});
