
interface MinimalIssue {
	id: number;
	number: number;
	title: string;
	labels: string[];
	state: string;
	pull_request: boolean;
	created_at: string;
	created_by: string | undefined;
	updated_at: string;
	closed_at: string | null;
	assignees: string[];
	body_length: number;
}

interface StoredIssue {
	fetchTimestamp: number;
	issue: MinimalIssue;
	comments: GitHubAPI.IssueComment[];
	events: GitHubAPI.IssueEvent[];
}
