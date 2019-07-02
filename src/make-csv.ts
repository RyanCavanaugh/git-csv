import fs = require('fs');
import path = require('path');
import csv = require('./csv');
import tree = require('./treeage');

import CSV = csv.CSV;

const dataDir = path.join(__dirname, '../data/');

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

function bestLabel(issue: GitHubAPI.Issue) {
	if (issue.pull_request) {
		return "PR";
	}

	const realLabels = issue.labels.map(lbl => {
		return LabelSynonyms[lbl.name] || lbl.name;
	});
	for (const lbl of LabelPriority) {
		if (realLabels.indexOf(lbl) >= 0) {
			return lbl;
		}
	}
	return issue.state === 'closed' ? "External" : "Untriaged";
}

interface ActivityRecord {
	issueId: number;
	pullRequest: boolean;
	activity: string;
	actor: string;
	date: Date;
	length: number;
}

function merge<T, U>(base: T, extras: U): T & U;
function merge(base: any, extras: any): any {
	Object.keys(base).forEach(k => extras[k] = base[k]);
	return extras;
}

function getActivityRecords(issue: StoredIssue) {
	if (issue.issue === undefined || issue.issue.number === undefined) return [];

	const result: ActivityRecord[] = [];
	const base = {
		issueId: issue.issue.number,
		pullRequest: !!issue.issue.pull_request
	};

	if (issue.comments) {
		issue.comments.forEach(comment => {
			result.push(merge(base, {
				activity: "comment",
				actor: comment.user ? comment.user.login : '(none)',
				date: new Date(comment.created_at),
				length: comment.body ? comment.body.length : 0
			}));
		});
	}

	if (issue.events) {
		issue.events.forEach(event => {
			result.push(merge(base, {
				activity: event.event,
				actor: getActor(event),
				date: new Date(event.created_at),
				length: 0
			}));
		});
	}

	result.push(merge(base, {
		activity: 'created',
		actor: (issue.issue.user ? issue.issue.user.login : '(none)'),
		date: new Date(issue.issue.created_at),
		length: issue.issue.body.length || 0
	}));

	return result;

	function getActor(event: any) {
		if (event.event === "assigned") {
			return event.assigner ? event.assigner.login : '(none)'
		}
		return event.actor ? event.actor.login : '(none)'
	}
}

function hasLabel(issue: GitHubAPI.Issue, name: string) {
	return issue.labels.some(l => l.name === name);
}

function hasAnyLabel(issue: GitHubAPI.Issue, ...names: string[]): string | undefined {
	return issue.labels.map(l => l.name).filter(l => names.indexOf(l) >= 0)[0];
}

function categorize(issue: GitHubAPI.Issue): [string, string] {
	if (issue.pull_request) return ["Pull Request", ""];

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

function getMonthCreated(i: GitHubAPI.Issue): string {
	const date = new Date(timestampToDate(i.created_at));
	return getMonthOfDate(date);
}

function getMonthOfDate(date: Date): string {
	return `${date.getFullYear()}-${("0" + (1 + date.getMonth())).slice(-2)}`
}

function getStoredIssue(issue: GitHubAPI.Issue) {
	const file = path.join(dataDir, `${issue.number}.json`);
	const fileData = <StoredIssue>JSON.parse(fs.readFileSync(file, 'utf-8'));
	return fileData;
}

function makeIssueReport(data: GitHubAPI.Issue[]) {
	const issues = new CSV<GitHubAPI.Issue>();
	issues.addColumn('Issue ID', i => i.number.toString());
	issues.addColumn('Title', i => i.title);
	issues.addColumn('Month Created', i => getMonthCreated(i));
	issues.addColumn('Assigned To', i => i.assignee ? i.assignee.login : "");
	issues.addColumn('Created Date', i => timestampToDate(i.created_at));
	issues.addColumn('Created By', i => i.user ? i.user.login : '(none)');
	issues.addColumn('Category1', i => categorize(i)[0]);
	issues.addColumn('Category2', i => categorize(i)[1]);
	issues.addColumn('Type', i => i.pull_request ? "PR" : "Issue");
	issues.addColumn('State', i => i.state);
	issues.addColumn('Category', i => BroadCategories[bestLabel(i)] || bestLabel(i));
	issues.addColumn('Milestone', i => i.milestone ? i.milestone.title : "");
	issues.addColumn('Label', i => bestLabel(i));
	issues.addColumn('Comments', i => i.comments.toString());
	issues.addColumn('Upvotes', issue => {
		const file = path.join(dataDir, `${issue.number}.json`);
		const fileData = <StoredIssue>JSON.parse(fs.readFileSync(file, 'utf-8'));
		return fileData.reactions.filter(f => f.content === "+1").length.toString();
	});

	fs.writeFileSync('issues.csv', issues.generate(data).join('\r\n'), { encoding: 'utf-8' });
}

function makeActivityReport(data: GitHubAPI.Issue[]) {
	const activity = new CSV<ActivityRecord>();
	activity.addColumn('Issue ID', i => i.issueId.toString());
	activity.addColumn('Type', i => i.pullRequest ? "PR" : "Issue");
	activity.addColumn('Activity', i => i.activity || "?");
	activity.addColumn('User', i => i.actor);
	activity.addColumn('Date', i => i.date.toLocaleDateString());
	activity.addColumn('Month', i => getMonthOfDate(i.date));
	activity.addColumn('Length', i => i.length.toString());
	const activities: ActivityRecord[] = [];
	data.forEach(issue => {
		const file = path.join(dataDir, `${issue.number}.json`);
		const fileData = <StoredIssue>JSON.parse(fs.readFileSync(file, 'utf-8'));
		if (fileData.issue) {
			getActivityRecords(fileData).forEach(rec => {
				if (!isNaN(rec.date.getDay())) {
					activities.push(rec);
				}
			});
		}
	});

	fs.writeFileSync('activity.csv', activity.generate(activities).join('\r\n'), { encoding: 'utf-8' });
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
				lines.push([day.toLocaleDateString(), milestone,dev, "Resolved", resolvedCount.toString()]);
				lines.push([day.toLocaleDateString(), milestone,dev, "Open", openCount.toString()]);
			}
		}
	}

	fs.writeFileSync("burndown.csv", lines.map(line => line.join(",")).join("\r\n"), { encoding: "utf-8" });
}

function main() {
	let data = <GitHubAPI.Issue[]>JSON.parse(fs.readFileSync(path.join(dataDir, 'issue-index.json'), 'utf-8'));
	data = data.filter(i => !!i && !!i.number);

	console.log("Making issue report");
	makeIssueReport(data);
	console.log("Making activity report");
	makeActivityReport(data);

	console.log("Making burndown chart");
	makeBurndownChart(data,
		["TypeScript 3.5.0", "TypeScript 3.6.0", "TypeScript 3.7.0"],
		_i => true,
		new Date("4/1/2019"),
		new Date("6/12/2019"),
		["weswigham", "sheetalkamat", "rbuckton", "sandersn", "andrewbranch", "ahejlsberg", "orta"]);

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

main();
