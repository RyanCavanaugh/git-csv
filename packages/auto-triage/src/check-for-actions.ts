import { forEachIssue } from "@ryancavanaugh/git-csv-graphql-io/utils.js";

type Action = {
    kind: "lock",
    reason: "super-stale"
};

function isOlderThan(date: Date, obj: { years?: number, months?: number }) {
    const ms = (obj.months ?? 0) * 28 * 24 * 60 * 60 * 1000 +
                (obj.years ?? 0) * 525600 * 60 * 60 * 1000;
    const now = +(new Date());
    return (+date) < (now - ms);
}

forEachIssue("all/microsoft/TypeScript", issue => {
    // Already locked
    if (issue.locked) return;

    // Dormant milestone, ignore
    if (issue.milestone?.title === "Dormant") return;

    // Not closed
    if (!issue.closed) return;

    // Not a bug
    const isBug = issue.labels.nodes.some(n => n?.name === "Bug");
    if (!isBug) return;

    const updatedAt = new Date(issue.updatedAt);

    const isFixed = issue.labels.nodes.some(n => n?.name === "Fixed");

    const isVeryStale = isOlderThan(updatedAt, { years: 2 });

    const isStale = isOlderThan(updatedAt, { years: 2, months: 6 });
    if (isVeryStale) {
        console.log(`Lock ${issue.url} (it is extremely stale)`);
    } else if (isFixed && isStale && !issue.locked) {
        console.log(`Lock ${issue.url} (it is Fixed and stale)`);
    } else if (issue.closedByPullRequestsReferences.nodes.length) {
        console.log(`Lock ${issue.url} (addressed by ${issue.closedByPullRequestsReferences.nodes[0]?.number})`);
    } else {
        console.log(`Dunno, ${issue.url}`);
    }
});
