import zod from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { allowedDomains, allowedKinds, allowedSeverity, systemPrompt } from './issue-summarizer-prompt.js';
import type { Issue } from '@ryancavanaugh/git-csv-graphql-io/index.js';

export type IssueSummary = zod.TypeOf<typeof IssueSummary>;
export const IssueSummary = zod.object({
    domain: zod.enum(allowedDomains),
    kind: zod.enum(allowedKinds),
    severity: zod.enum(allowedSeverity),
    tone: zod.union([zod.literal(0), zod.literal(1), zod.literal(2), zod.literal(3), zod.literal(4), zod.literal(5), zod.literal(6), zod.literal(7), zod.literal(7), zod.literal(8), zod.literal(9), zod.literal(10)]),
    clarity: zod.union([zod.literal(0), zod.literal(1), zod.literal(2), zod.literal(3), zod.literal(4), zod.literal(5), zod.literal(6), zod.literal(7), zod.literal(7), zod.literal(8), zod.literal(9), zod.literal(10)]),
    summary: zod.string(),
    description: zod.string()
});

export function getBatchLineForIssue(issue: Issue) {
    const batchLine = getCompletionBatchEntryForSummarizeTask(issue.body, `issue-summary-${issue.number}`);
    return batchLine;
}

const jsonSchema = zodToJsonSchema(IssueSummary, { name: "schema" });
function getCompletionBatchEntryForSummarizeTask(userContent: string, customId: string) {
    // limit to 16k of content
    userContent = userContent.substring(0, 16384);
    const obj = {
        custom_id: customId,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
            model: "gpt-4o-mini",
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userContent
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    strict: true,
                    name: "issue-summary",
                    ...jsonSchema.definitions
                }
            }
        }
    };
    return JSON.stringify(obj);
};
