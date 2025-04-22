import { zodToJsonSchema } from 'zod-to-json-schema';
import { zodResponseFormat } from 'openai/helpers/zod';
import { AzureOpenAI } from "openai";
import z from "zod";
import type { Issue } from "@ryancavanaugh/git-csv-graphql-io/index.js";
import { forEachIssue } from "@ryancavanaugh/git-csv-graphql-io/utils.js";
import fs from "fs/promises";
import path from "path";
import type { ResponseInputItem } from "openai/resources/responses/responses.mjs";
import { fail } from "assert";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { parseFAQs } from './faq-parser.js';

const RoleLookup: Record<string, "maintainer" | "bot" | undefined> = {
    "RyanCavanaugh": "maintainer",
    "typescript-bot": "bot"
};
const faqs = parseFAQs(await fs.readFile(path.join(import.meta.dirname, "../prompts/FAQs.md"), "utf-8"));

//const apiKey = process.env.AZUREAI_API_KEY;

const endpoint = "https://ryanca-aoai.openai.azure.com/";
const modelName = "o1";
const deployment = "o1";
process.env.AZURE_LOG_LEVEL = "verbose";
const credential = new DefaultAzureCredential();
const scope = "https://cognitiveservices.azure.com/.default";
const azureADTokenProvider = getBearerTokenProvider(credential, scope);
const apiVersion = "2024-12-01-preview";
const options = { endpoint, azureADTokenProvider, deployment, apiVersion }

const openai = new AzureOpenAI(options);

const Prompts = {
    IssueAnalysis: await fs.readFile(path.join(import.meta.dirname, "../prompts/issue-analysis.md"), "utf-8"),
    FaqResponse: await fs.readFile(path.join(import.meta.dirname, "../prompts/write-faq-response.md"), "utf-8")
};

const CreatedInputSchema = z.object({
    title: z.string(),
    body: z.string()
});

const exampleCreatedInput: z.TypeOf<typeof CreatedInputSchema> = {
    title: "TypeScript should support XHTML",
    body: "TS is cool but should support xhtml comments. Think about how cool that would be, and how much fun we could have"
};

const CreatedOutputSchema = z.object({
    summary: z.string(),
    faqs: z.array(z.union([z.literal("none"), ...faqs.map(f => z.literal(f.title))] as any))
});
const exampleCreatedOutput: z.TypeOf<typeof CreatedOutputSchema> = {
    summary: "A feature request to add XHTML comments",
    faqs: []
};

const MetadataSchema = z.object({
    labels: z.array(z.string()),
    milestone: z.string()
});
const exampleMetadataInput: z.TypeOf<typeof MetadataSchema> = {
    labels: ["Needs More Info"],
    milestone: "none"
}

const CommentAnalysisInputSchema = z.object({
    username: z.string(),
    role: z.union([z.literal("user"), z.literal("bot"), z.literal("maintainer")]),
    comment: z.string()
});

const exampleCommentInput: z.TypeOf<typeof CommentAnalysisInputSchema> = {
    username: "octupustim",
    role: "user",
    comment: "I think this feature would be very useful for our project. It would save us a lot of time and effort. Can I work on it?"
};

const SentimentSchema = z.object({
    helpful: z.number(),
    constructive: z.number(),
    rude: z.number(),
    clarity: z.number()
});

const AspectsSchema = z.object({
    "duplicate": z.number(),
    "claiming": z.number(),
    "age-complaint": z.number(),
    "reopen": z.number(),
    "closeReason": z.number(),
    "asks-question": z.number(),
    "answers-question": z.number()
});

const CommentAnalyisOutputSchema = z.object({
    sentiment: SentimentSchema,
    aspects: AspectsSchema,
    summary: z.string()//.max(180),
});

const exampleCommentOutput: z.TypeOf<typeof CommentAnalyisOutputSchema> = {
    sentiment: {
        helpful: 7,
        constructive: 8,
        rude: 1,
        clarity: 9
    },
    aspects: {
        "duplicate": 1,
        "claiming": 9,
        "age-complaint": 1,
        "reopen": 1,
        "closeReason": 1,
        "asks-question": 1,
        "answers-question": 1,
    },
    summary: "indicates enthusiasm for the feature and asks to work on it"
};

const SummarizeInputSchema = z.object({
    "generate": z.literal("summary")
});

const SummarizeOutputSchema = z.object({
    summary: z.union([
        z.object({
            outcome: z.literal("nothing-to-do"),
            why: z.string()
        }),
        z.object({
            outcome: z.literal("canned-response"),
            prewrite: z.string()
        }),
        z.object({
            outcome: z.literal("intervene"),
            prewrite: z.string(),
            why: z.string()
        }),
        z.object({
            outcome: z.literal("reanalyze"),
            why: z.string()
        }),
        z.object({
            outcome: z.literal("followup-comment"),
            prewrite: z.string(),
            why: z.string()
        }),
        z.object({
            outcome: z.literal("leave-open"),
            why: z.string()
        }),
        z.object({
            outcome: z.literal("unsure"),
            why: z.string()
        }),
    ])
});

const exampleSummarizeOutput: z.TypeOf<typeof SummarizeOutputSchema> = {
    summary: {
        outcome: "followup-comment",
        prewrite: "This is correct behavior because of contravariance. See the corresponding FAQ entry",
        why: "The user asked a question answered previously in the thread"
    }
};

const FaqOutputSchema = z.object({
    message: z.string(),
    confidence: z.number()
});

export async function processIssue(issue: Issue) {
    const output = await summarizeIssue(issue);
    for (const line of output) {
        console.log(line);
    }
}

async function processAll() {
    const issues: Issue[] = []
    await forEachIssue("recent", issue => {
        if (new Date(issue.createdAt) > (new Date("2025/04/08"))) {
            console.log(issue.title);
            issues.push(issue);
        }
    });
    console.log(`Found ${issues.length} issues`);

    for (const issue of issues) {
        await summarizeIssue(issue);
    }
}

async function summarizeIssue(issue: Issue): Promise<string[]> {
    console.log(`#${issue.number} - ${issue.title}`);
    const timelineOutput: string[] = [];

    const replacements = {
        "$CREATED_INPUT_EXAMPLE$": exampleCreatedInput,
        "$CREATED_OUTPUT_EXAMPLE$": exampleCreatedOutput,
        "$METADATA_INPUT_EXAMPLE$": exampleMetadataInput,
        "$COMMENT_INPUT_EXAMPLE$": exampleCommentInput,
        "$COMMENT_OUTPUT_EXAMPLE$": exampleCommentOutput,
        "$SUMMARIZE_OUTPUT_EXAMPLE$": exampleSummarizeOutput,
        "$FAQ_LISTING$": faqs.map(faq => ` * ${faq.title}: ${faq.summary}`).join("\n")
    };

    let initialPrompt = Prompts.IssueAnalysis;
    for (const [k, v] of Object.entries(replacements)) {
        let prev = initialPrompt;
        initialPrompt = initialPrompt.replace(k, JSON.stringify(v, undefined, 2));
        if (initialPrompt === prev) {
            fail("Should have changed something from key " + k);
        }
    }

    const messageSequence: ChatCompletionMessageParam[] = [{
        "role": "system",
        "content": [
            {
                "type": "text",
                "text": initialPrompt
            }
        ]
    }];

    // Generate the creation summary
    addUserMessage(CreatedInputSchema, {
        title: issue.title,
        body: issue.body
    });
    const output = await invokeCompletion(CreatedOutputSchema);
    console.log(JSON.stringify(output, undefined, 2));

    timelineOutput.push(`### Bug #${issue.number} by ${issue.author?.login ?? "(ghost)"}\n`);
    timelineOutput.push(`Title: ${issue.title}\n`);
    timelineOutput.push(`Summary: ${output.summary}\n`);
    timelineOutput.push(`FAQs: ${output.faqs.join(",") || "(none)"}\n`);

    // FAQ response
    if (output.faqs.length > 0) {
        for (const f of output.faqs) {
            const entry = faqs.filter(faq => faq.title === f)[0];
            const messages: ChatCompletionMessageParam[] = [
                {
                    role: "system",
                    content: Prompts.FaqResponse
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        issue: issue.body,
                        faq: entry.content
                    }, undefined, 2)
                }
            ];
            const faqResponse = await getChatCompletionJsonResponse(messages, FaqOutputSchema);
            console.log(`FAQ ${f.title} confidence: ${faqResponse.confidence}:`);
            console.log(faqResponse.message);
        }
    }

    // Timeline items
    for (const timelineItem of issue.timelineItems.nodes) {
        if (timelineItem?.__typename === "IssueComment") {
            addUserMessage(CommentAnalysisInputSchema, {
                role: RoleLookup[timelineItem.author?.login ?? ""] ?? "user",
                username: timelineItem.author?.login ?? "ghost",
                comment: timelineItem.body
            });
            const output = await invokeCompletion(CommentAnalyisOutputSchema);
            console.log(JSON.stringify(output, undefined, 2));

            timelineOutput.push(` * ${timelineItem.author?.login ?? "(ghost)"} ${output.summary}`)
            const factors: string[] = [];
            for (const [k, v] of Object.entries({ ...output.aspects, ...output.sentiment })) {
                if (v > 8) factors.push(k);
            }
            if (factors.length > 0) {
                timelineOutput.push(`    * ${factors.map(f => `\`${f}\``).join(", ")}`);
            }

            // process.exit(0);
        }
    }

    // Provide a summary
    {
        timelineOutput.push("\n");
        addUserMessage(SummarizeInputSchema, { "generate": "summary" });
        const output = await invokeCompletion(SummarizeOutputSchema);
        timelineOutput.push(`Recommended Action: ${output.summary.outcome}\n`);
        if ("why" in output.summary) {
            timelineOutput.push(`Why: ${output.summary.why}`);
        }
        if ("prewrite" in output.summary) {
            timelineOutput.push(`> ${output.summary.prewrite}`);
        }
    }

    return timelineOutput;

    function addUserMessage<T extends Zod.ZodType>(schema: T, obj: Zod.TypeOf<T>) {
        messageSequence.push({
            "role": "user",
            "content": JSON.stringify(obj, undefined, 2)
        });
    }

    async function invokeCompletion<T extends Zod.ZodType>(responseSchema: T): Promise<Zod.TypeOf<T>> {
        const response = await openai.chat.completions.create({
            model: "o1",
            messages: messageSequence,
            response_format: zodResponseFormat(responseSchema, "response"),
            tools: [],
            store: false
        });
        messageSequence.push({
            "role": "assistant",
            content: response.choices[0].message.content,
        });
        return responseSchema.parse(JSON.parse(response.choices[0].message.content ?? "null"));
    }
}

async function getChatCompletionJsonResponse<T extends Zod.ZodType>(messageSequence: ChatCompletionMessageParam[], responseSchema: T): Promise<Zod.TypeOf<T>> {
    const response = await openai.chat.completions.create({
        model: "o1",
        messages: messageSequence,
        response_format: zodResponseFormat(responseSchema, "response"),
        tools: [],
        store: false
    });
    return responseSchema.parse(JSON.parse(response.choices[0].message.content ?? "null"));
}
