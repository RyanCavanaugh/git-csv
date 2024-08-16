import type { Issue } from "@ryancavanaugh/git-csv-graphql-io/index.js";
import { getBatchLineForIssue, IssueSummary } from "./summarize-issue.js";
import { AICacheDirectory } from "@ryancavanaugh/git-csv-common";
import { createCache } from "./directory-cache.js";

const cache = createCache(AICacheDirectory);

export async function tryGetIssueSummary(issue: Issue): Promise<IssueSummary | undefined> {
    const line = getBatchLineForIssue(issue);
    const entry = await cache.tryReadCacheFile(line);
    if (entry === undefined) return undefined;
    return IssueSummary.parse(JSON.parse(entry));
}
