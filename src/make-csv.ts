import fs = require('fs');
import path = require('path');

type ColumnValueMaker<T> = string | ((x: T) => string);

function timestampToDate(s: string): string {
	return new Date(s).toLocaleDateString();
}

class CSV<T> {
	colNames: string[] = [];
	producers: ColumnValueMaker<T>[] = [];

	addColumn(name: string, funcOrKey: ColumnValueMaker<T>) {
		this.colNames.push(name);
		this.producers.push(funcOrKey);
	}

	private static quote(s: string): string {
		return '"' + s.replace(/"/g, "'").replace(/^--/, ' --') + '"';
	}

	generate(arr: T[]): string[] {
		const result: string[] = [];

		result.push(this.colNames.join(','));

		arr.forEach((entry: any) => {
			const cells: string[] = [];
			this.producers.forEach(key => {
				if (typeof key === 'string') {
					cells.push(entry[key]);
				} else {
					cells.push(key(entry));
				}
			});

			result.push(cells.map(CSV.quote).join(','));
		});

		return result;
	}
}

const LabelSynonyms: { [s: string]: string } = {
	"Working as Intended": "By Design",
	"Design Limitation": "By Design",
	"Too Complex": "Declined",
	"Out of Scope": "Declined",
	"Migrate-a-thon": "Misc"
};

const LabelPriority = [
	"Misc",
	"Website Logo",
	"Design Notes",
	"Duplicate",
	"Fixed",
	"By Design",
	"Declined",
	"Won't Fix",
	"Accepting PRs",
	"External",
	"Question",
	"Bug",
	"Suggestion",
	"Needs Proposal",
	"Needs More Info",
	"Awaiting More Feedback",
	"In Discussion",
	"Docs",
	"Discussion",
	"Infrastructure",
	"Spec"
];

function bestLabel(issue: MinimalIssue) {
	const realLabels = issue.labels.map(lbl => {
		return LabelSynonyms[lbl] || lbl;
	});
	for (const lbl of LabelPriority) {
		if (realLabels.indexOf(lbl) >= 0) {
			return lbl;
		}
	}
	return undefined;
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
	const result: ActivityRecord[] = [];
	const base = {
		issueId: issue.issue.number,
		pullRequest: issue.issue.pull_request
	};
	issue.comments.forEach(comment => {
		result.push(merge(base, {
			activity: "comment",
			actor: comment.user.login,
			date: new Date(comment.created_at),
			length: comment.body.length
		}));
	});
	issue.events.forEach(event => {
		result.push(merge(base, {
			activity: event.event,
			actor: event.actor ? event.actor.login : '(none)',
			date: new Date(event.created_at),
			length: 0
		}));
	})
	result.push(merge(base, {
		activity: 'created',
		actor: issue.issue.created_by || '(none)',
		date: new Date(issue.issue.created_at),
		length: issue.issue.body_length || 0
	}));
	return result;
}

const data = <MinimalIssue[]>JSON.parse(fs.readFileSync('issue-index.json', 'utf-8'));

const issues = new CSV<MinimalIssue>();
issues.addColumn('Issue ID', i => i.number.toString());
issues.addColumn('Title', i => i.title);
issues.addColumn('Created Date', i => timestampToDate(i.created_at));
issues.addColumn('Created By', i => i.created_by || '(none)');
issues.addColumn('Type', i => i.pull_request ? "PR" : "Issue");
issues.addColumn('State', i => i.state);
issues.addColumn('Label', i => i.pull_request ? "PR" : (bestLabel(i) || (i.state === 'closed' ? 'Closed' : 'Unlabeled')));

fs.writeFile('issues.csv', issues.generate(data).join('\r\n'), 'utf-8');

const activity = new CSV<ActivityRecord>();
activity.addColumn('Issue ID', i => i.issueId.toString());
activity.addColumn('Type', i => i.pullRequest ? "PR" : "Issue");
activity.addColumn('Activity', i => i.activity);
activity.addColumn('User', i => i.actor);
activity.addColumn('Date', i => i.date.toLocaleDateString());
activity.addColumn('Length', i => i.length.toString());
const activities: ActivityRecord[] = [];
data.forEach(issue => {
	const file = path.join(__dirname, 'data', `${issue.number}.json`);
	const fileData = <StoredIssue>JSON.parse(fs.readFileSync(file, 'utf-8'));
	getActivityRecords(fileData).forEach(rec => activities.push(rec));
});

fs.writeFile('activity.csv', activity.generate(activities).join('\r\n'), 'utf-8');

