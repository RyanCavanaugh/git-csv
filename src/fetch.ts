import fs = require('fs');
import https = require('https');
import path = require('path');

const oath = require('../../search-auth.json');

const dataPath = path.join(__dirname, "../data");
const indexFilename = path.join(dataPath, 'issue-index.json');

let rateLimit: number;

interface Parameters {
	[s: string]: string;
}

function githubRequest(prefix: string, owner: string | undefined, repo: string | undefined, path: string | undefined, params: Parameters, format: string | undefined, done: (data: string) => void) {
	if (format === undefined) format = 'text/json';

	rateLimit--;

	if (rateLimit === 0) {
		console.log('Aborting because we are about to hit the rate limit. Try again later.');
		return;
	}

	params['client_id'] = oath['client-id'];
	params['client_secret'] = oath['client-secret'];

	let parts = [prefix, owner, repo, path].filter(s => !!s);
	let paramStr = Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');

	let options = {
		host: 'api.github.com',
		path: '/' + parts.join('/') + '?' + paramStr,
		headers: {
			'User-Agent': 'RyanCavanaugh',
			'Accept': format
		},
		method: 'GET'
	};

	https.get(options, res => {
		let data = '';
		res.on('data', (d: string) => {
			data = data + d;
		});
		res.on('end', () => {
			done(data);
		});
	});
}

function getPagedData(prefix: string, owner: string, repo: string, path: string, params: Parameters, format: string | undefined, per_page: number, done: (data: {}[]) => void, transform?: (x: {}) => {}) {
	const myParams = JSON.parse(JSON.stringify(params));
	next(1);

	let result: {}[] = [];

	function next(pageNumber: number) {
		myParams['page'] = pageNumber.toString();
		myParams['per_page'] = per_page.toString();
		githubRequest(prefix, owner, repo, path, myParams, format, (data: string) => {
			const parsedData = <{}[]>JSON.parse(data);
			if (per_page === undefined) per_page = parsedData.length;
			result = result.concat(transform ? parsedData.map(transform) : parsedData);

			if (parsedData.length < per_page) {
				done(result);
			} else {
				next(pageNumber + 1);
			}
		});
	}
}

function fetchIssues(done: (data: GitHubAPI.Issue[]) => void) {
	let params: Parameters = {};
	// Sort by issue 1, 2, 3, ... so that we don't have page overlap issues
	params['sort'] = 'created';
	params['direction'] = 'asc';
	params['state'] = 'all';

	getPagedData('repos', 'Microsoft', 'TypeScript', 'issues', params, undefined, 100, (data: GitHubAPI.Issue[]) => {
		done(data);
	});
}

function getDataFilePath(issue: GitHubAPI.Issue) {
	return path.join(dataPath, `${issue.number}.json`);
}

function parseTimestamp(t: string): number {
	return +(new Date(t));
}

function fetchIssueData(issue: GitHubAPI.Issue, done: () => void) {
	const filename = getDataFilePath(issue);

	fs.exists(filename, exists => {
		if (exists) {
			fs.readFile(filename, {encoding: 'utf-8' }, (err, data) => {
				if (err) throw err;
				
				const storedData: StoredIssue = JSON.parse(data);
				if (storedData.fetchTimestamp >= parseTimestamp(issue.updated_at)) {
					done();
				} else {
					update();
				}
			});
		} else {
			update();
		}
	});

	function update() {
		const fetchTimestamp = Date.now();

		console.log(`Download issue data for ${issue.number}`);
		getPagedData('repos', 'Microsoft', 'TypeScript', `issues/${issue.number}/comments`, {}, undefined, 100, (comments: GitHubAPI.IssueComment[]) => {
			getPagedData('repos', 'Microsoft', 'TypeScript', `issues/${issue.number}/events`, {}, undefined, 100, (events: GitHubAPI.IssueEvent[]) => {
				const data: StoredIssue = {
					comments,
					events,
					fetchTimestamp,
					issue
				};
				fs.writeFile(filename, JSON.stringify(data, undefined!, 2), {encoding: 'utf-8' }, err => {
					if (err) throw err;
					done();
				});
			});
		});
	}
}

function fetchIssuesData(data: GitHubAPI.Issue[]) {
	next();

	function next() {
		if (data.length === 0) return;

		const issue = data.pop()!;
		fetchIssueData(issue, next);
	}
}

function main() {
	console.log('Fetch issue index');
	fs.exists(indexFilename, exists => {
		if (exists) {
			console.log('Issue index exists already');
			fs.readFile(indexFilename, {encoding: 'utf-8' }, (err, data) => {
				if (err) throw err;
				fetchIssuesData(JSON.parse(data));
			});
		} else {
			fetchIssues(issues => {
				console.log('Downloading issue index');
				fs.writeFile(indexFilename, JSON.stringify(issues, undefined!, 2), {encoding: 'utf-8' }, err => {
					if (err) throw err;
					console.log('Fetch issues data');
					fetchIssuesData(issues);
				});
			});
		}
	});
}

githubRequest('rate_limit', undefined, undefined, undefined, {}, undefined, rateLimitStr => {
	let rates = JSON.parse(rateLimitStr);
	rateLimit = rates['rate']['remaining'];
	console.log(rateLimitStr);
	console.log('Started up; remaining rate limit = ' + rateLimit);

	main();
});
