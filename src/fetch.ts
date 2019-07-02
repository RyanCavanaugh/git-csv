import fs = require('fs-extra');
import https = require('https');
import path = require('path');

const oath = require('../../search-auth.json');

const dataPath = path.join(__dirname, "../data");
const indexFilename = path.join(dataPath, 'issue-index.json');

let rateLimit: number;
let rateReset: number;

async function updateRateLimit() {
	rateLimit = 1;
	const rateLimitStr = await githubRequest('rate_limit', undefined, undefined, undefined, {}, undefined)
	let rates = JSON.parse(rateLimitStr.data);
	rateLimit = rates['rate']['remaining'];
	rateReset = rates['rate']['reset'];
	console.log('Started up; remaining rate limit = ' + rateLimit);
}

interface Parameters {
	[s: string]: string;
}

function githubRequest(prefix: string, owner: string | undefined, repo: string | undefined, path: string | undefined, params: Parameters, format: string | undefined): Promise<{ data: string, fetchedUrl: string }> {
	return new Promise<{ data: string, fetchedUrl: string }>((resolve, reject) => {
		if (format === undefined) format = 'text/json';

		if (rateLimit === 0) {
			const waitAmount = 20 + rateReset - (Date.now() / 1000);
			console.log(`Waiting ${waitAmount | 0}s for rate limit reset`);
			setTimeout(async () => {
				await updateRateLimit();
				go();
			}, waitAmount * 1000);
		} else {
			go();
		}

		function go() {
			rateLimit--;

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
				res.on('error', e => {
					throw e;
				});
				res.on('end', () => {
					if (data === '') {
						console.log("Got empty data; retrying...");
						setTimeout(go, 1000);
					} else {
						resolve({ data, fetchedUrl: options.path });
					}
				});
			});
		}
	});
}

async function getPagedData(prefix: string, owner: string, repo: string, path: string, params: Parameters, format: string | undefined, per_page: number, transform?: (x: {}) => {}): Promise<any[]> {
	const myParams = JSON.parse(JSON.stringify(params));
	let pageNumber = 1;
	let result: {}[] = [];
	while (true) {
		myParams['page'] = pageNumber.toString();
		myParams['per_page'] = per_page.toString();
		const { data, fetchedUrl } = await githubRequest(prefix, owner, repo, path, myParams, format);
		let parsedData: {}[];
		try {
			parsedData = JSON.parse(data);
		} catch (e) {
			console.log(`Error parsing JSON`);
			console.log(`=========`);
			console.log(data);
			console.log(`=========`);
			throw new Error(`Failed to load from ${fetchedUrl}`);
		}

		if (per_page === undefined) per_page = parsedData.length;
		result = result.concat(transform ? parsedData.map(transform) : parsedData);

		if (parsedData.length < per_page) {
			break;
		}
		pageNumber++;
	}

	return result;
}

async function fetchIssuesIndex() {
	let params: Parameters = {};
	// Sort by issue 1, 2, 3, ... so that we don't have page overlap issues
	params['sort'] = 'created';
	params['direction'] = 'asc';
	params['state'] = 'all';

	return await getPagedData('repos', 'Microsoft', 'TypeScript', 'issues', params, undefined, 100);
}

function getDataFilePath(issue: GitHubAPI.Issue) {
	return path.join(dataPath, `${issue.number}.json`);
}

function parseTimestamp(t: string): number {
	return +(new Date(t));
}

async function fetchIssueData(issue: GitHubAPI.Issue) {
	if (issue.number === undefined) return;
	
	const filename = getDataFilePath(issue);

	if (fs.existsSync(filename)) {
		const data = await fs.readFile(filename, { encoding: "utf-8" });
		const storedData: StoredIssue = JSON.parse(data);
		if (storedData.fetchTimestamp >= parseTimestamp(issue.updated_at)) {
			// Already up to date
			return;
		}
	}

	const fetchTimestamp = Date.now();

	console.log(`Download issue data for ${issue.number}`);
	const comments: GitHubAPI.IssueComment[] = await getPagedData('repos', 'Microsoft', 'TypeScript', `issues/${issue.number}/comments`, {}, undefined, 100);
	const events: GitHubAPI.IssueEvent[] = await getPagedData('repos', 'Microsoft', 'TypeScript', `issues/${issue.number}/events`, {}, undefined, 100);
	const reactions: GitHubAPI.IssueReaction[] = await getPagedData('repos', 'Microsoft', 'TypeScript', `issues/${issue.number}/reactions`, {}, "application/vnd.github.squirrel-girl-preview+json", 100);
	const data: StoredIssue = {
		comments,
		events,
		reactions,
		fetchTimestamp,
		issue,
	};
	await fs.writeFile(filename, JSON.stringify(data, undefined, 2), { encoding: "utf-8" });
}

async function fetchIssuesData(data: GitHubAPI.Issue[]) {
	for (const item of data) {
		await fetchIssueData(item);
	}
}

async function updateIssuesIndex(issueIndex: GitHubAPI.Issue[]) {
	// Load issues sorted by "recently updated" until we hit an issue that is already up-to-date,
	// then load the first page of this *again* to catch the issues that we updated while we
	// were fetching pages
	await go();
	issueIndex.sort((a, b) => a.number - b.number);

	async function go() {
		let pageNumber = 1;
		while(true) {
			if (await fetchPageAndUpdate(pageNumber)) break;
			pageNumber++;
		}
		await fetchPageAndUpdate(1);
	}

	// Return true if it encounted an up-to-date issue
	async function fetchPageAndUpdate(pageNumber: number): Promise<boolean> {
		const params = {
			per_page: "100",
			page: pageNumber.toString(),
			filter: "all",
			state: "all",
			sort: "updated"
		};
		const { data } = await githubRequest("repos", "Microsoft", "TypeScript", "issues", params, undefined);
		const parsed: GitHubAPI.Issue[] = JSON.parse(data);
		let returnValue = false;
		for (const issue of parsed) {
			let existingIndex = find(issue.number);
			if (existingIndex === undefined) {
				// New issue
				issueIndex.push(issue);
			} else if (issueIndex[existingIndex].updated_at === issue.updated_at) {
				// Up to date!
				returnValue = true;
			} else {
				// Update this issue
				issueIndex[existingIndex] = issue;
			}
		}
		return returnValue;
	}

	function find(num: number): number | undefined {
		for (let i = 0; i < issueIndex.length; i++) {
			if (issueIndex[i].number === num) {
				return i;
			}
		}
		return undefined;
	}
}

async function main() {
	await updateRateLimit();

	let index: GitHubAPI.Issue[];
	if (fs.existsSync(indexFilename)) {
		console.log('Issue index exists already; updating');
		const indexData = await fs.readFile(indexFilename, { encoding: 'utf-8' });
		index = JSON.parse(indexData);
		await updateIssuesIndex(index);
	} else {
		console.log('Fetch fresh issue index');
		index = await fetchIssuesIndex();
	}
	console.log("Write index to disk");
	await fs.writeFile(indexFilename, JSON.stringify(index, undefined!, 2), { encoding: 'utf-8' });
	console.log("Update individual issue data");
	await fetchIssuesData(index);
}

main().then(() => {
	console.log("Done!")
});
