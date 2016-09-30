interface StoredIssue {
	fetchTimestamp: number;
	issue: GitHubAPI.Issue;
	comments: GitHubAPI.IssueComment[];
	events: GitHubAPI.IssueEvent[];
}
