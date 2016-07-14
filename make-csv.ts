import fs = require('fs');

interface SimplifiedIssue {
	assignedTo: string;
	title: string;
	state: string;
	number: number;
	labels: {
		name: string;
	}[];
	createdAt: number;
	updatedAt: number;
	loggedByName: string;
	comments: number;
	isPullRequest: boolean;
}

function simplify(i: Issue): MinimalIssue {
	return {
		assignedTo: i.assignee ? i.assignee.login : '',
		body: i.body.substr(0, 250),
		comments: i.comments,
		createdAt: Date.parse(i.created_at),
		labels: i.labels,
		loggedByAvatar: i.user ? i.user.avatar_url : '(missing)',
		loggedByName: i.user ? i.user.login : '(missing)',
		milestone: i.milestone ? i.milestone.title : '',
		number: i.number,
		state: i.state,
		title: i.title,
		updatedAt: Date.parse(i.updated_at),
		isPullRequest: i.pull_request !== undefined
	};
}

let data: SimplifiedIssue[] = JSON.parse(fs.readFileSync('issues.json', 'utf-8')).filter(issue => (issue['pull_request'] === undefined));

data.sort((lhs, rhs) => rhs.createdAt - lhs.createdAt);

// Collect all the label names
const labels: { [name: string]: string } = {};
for(const issue of data) {
	for(const label of issue.labels) {
		labels[label.name] = label.name;
	}
}

const headers: string[] = [];
headers.push('Number', 'Kind', 'Title', 'State', 'Comments', 'Creator', 'Assignee', 'Created', 'Updated', 'Created-Month', 'Created-Year', 'Had-Template', 'Best-Label')
for(const label of Object.keys(labels)) {
	headers.push(label);
	headers.push('Is ' + label);
}

const labelPriority = [
	'Bug',
	'Suggestion',
	'Question',
	'By Design',
	'Duplicate',
	'External',
	'Needs More Info',
	'Website Logo',
	'Discussion',
	'Docs',
	'Other'
];

const rows: string[] = [headers.join(',')];
for(const issue of data) {
	const created = new Date(issue.createdAt);
	const createdMonth = created.getMonth() + 1;
	const createdMonthString = created.getFullYear() + '-' + ((createdMonth < 10) ? '0' : '') + createdMonth;
	const cols: string[] = [
		issue.number.toString(),
		issue.isPullRequest ? 'TRUE' : 'FALSE',
		'"' + issue.title.replace(/"/g, "'") + '"',
		issue.state,
		issue.comments.toString(),
		issue.loggedByName,
		issue.assignedTo,
		created.toLocaleDateString(),
		new Date(issue.updatedAt).toLocaleDateString(),
		createdMonthString,
		created.getFullYear().toString(),
		issue.createdAt > Date.parse('Feb 17, 2016 11:41:00 AM PST') ? 'TRUE' : 'FALSE'
	];

	let bestLabel = 'Other';
	for (const label of labelPriority) {
		if (issue.labels.some(lab => lab.name === label)) {
			bestLabel = label;
		}
	}
	cols.push(bestLabel);

	for(const label of Object.keys(labels)) {
		if(issue.labels.some(lab => lab.name === label)) {
			cols.push('true');
			cols.push('1');
		} else {
			cols.push('false');
			cols.push('0');
		}
	}

	rows.push(cols.join(','));
}

fs.writeFile('issues.csv', rows.join('\r\n'));

