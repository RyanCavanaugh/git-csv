import fs = require('fs');
import https = require('https');

const oath = JSON.parse(fs.readFileSync('../search-auth.json', 'utf-8'));

interface Parameters {
	[s: string]: string;
}

let rateLimit: number;
function githubRequest(prefix: string, owner: string, repo: string, path: string, params: Parameters, format: string, done: (data: string) => void) {
	if(format === undefined) format = 'text/json';

	rateLimit--;

	if(rateLimit === 0) {
		console.log('Aborting because we are about to hit the rate limit. Try again later.');
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
	}
	https.get(options, res => {
		let data = '';
		res.on('data', d => {
			data = data + d;
		});
		res.on('end', () => {
			done(data);
		});
	});
}

function getPagedData(prefix: string, owner: string, repo: string, path: string, params: Parameters, format: string, done: (data: {}[]) => void) {
	const myParams = JSON.parse(JSON.stringify(params));
	let per_page: number = +params['per_page'];
	next(1);

	let result: {}[] = [];

	function next(pageNumber: number) {
		myParams['page'] = pageNumber.toString();
		githubRequest(prefix, owner, repo, path, myParams, format, (data: string) => {
			const parsedData = <{}[]>JSON.parse(data);
			if(per_page === undefined) per_page = parsedData.length;
			result = result.concat(parsedData);

			if(parsedData.length < per_page) {
				done(result);
			} else {
				next(pageNumber + 1);
			}
		});
	}
}

function fetchIssues(done: (data: Issue[]) => void) {
	let params: Parameters = {};
	params['sort'] = 'created';
	params['per_page'] = '100';
	params['state'] = 'all';

	getPagedData('repos', 'Microsoft', 'TypeScript', 'issues', params, undefined, data => {
		done(<Issue[]>data);
	});
}

function reduceIssues(issues: Issue[]): MinimalIssue[] {
	function reduce(i: Issue): MinimalIssue {
		return {
			assignedTo: i.assignee ? i.assignee.login : '',
			body: i.body.substr(0, 250),
			comments: i.comments,
			createdAt: Date.parse(i.created_at),
			labels: i.labels,
			loggedByAvatar: i.user.avatar_url,
			loggedByName: i.user.login,
			milestone: i.milestone ? i.milestone.title : '',
			number: i.number,
			state: i.state,
			title: i.title,
			updatedAt: Date.parse(i.updated_at),
			isPullRequest: i.pull_request !== undefined
		};
	}

	return issues.map(reduce);
}

interface Star {
	user: {
		login: string;
	};
	starred_at: string;
}

function fetchStars(done: (data: Star[]) => void) {
	let params: Parameters = {};
	params['per_page'] = '100';

	getPagedData('repos', 'Microsoft', 'TypeScript', 'stargazers', params, 'application/vnd.github.v3.star+json', data => {
		done(<Star[]>data);
	});
}


githubRequest('rate_limit', undefined, undefined, undefined, {}, undefined, rateLimitStr => {
	let rates = JSON.parse(rateLimitStr);
	rateLimit = rates['rate']['remaining'];
	console.log('Started up; remaining rate limit = ' + rateLimit);

	main();
});

function main() {
	fetchIssues(issues => {
		fs.writeFileSync('issues.json', JSON.stringify(reduceIssues(issues)), 'utf-8');
	});
	fetchStars(stars => {
		const csv = stars
			.map(st => ({ user: st.user.login, date: (new Date(st.starred_at).toLocaleDateString())}))
			.map(entry => entry.user + ',' + entry.date)
			.join('\r\n');

		fs.writeFileSync('stars.csv', 'User,Date\r\n' + csv, 'utf-8');
	});
}
