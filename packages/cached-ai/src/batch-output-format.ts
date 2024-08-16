import zod from "zod";

export type BatchResponseLine = zod.TypeOf<typeof BatchResponseLine>;
export const BatchResponseLine = zod.object({
    id: zod.string(),
    custom_id: zod.string(),
    response: zod.object({
        status_code: zod.number(),
        request_id: zod.string(),
        body: zod.object({
            id: zod.string(),
            object: zod.string(),
            created: zod.number(),
            model: zod.string(),
            choices: zod.array(zod.object({
                index: zod.number(),
                message: zod.object({
                    role: zod.string(),
                    content: zod.string(),
                    refusal: zod.null()
                }),
                logprobs: zod.null(),
                finish_reason: zod.string()
            })),
            usage: zod.object({
                prompt_tokens: zod.number(),
                completion_tokens: zod.number(),
                total_tokens: zod.number()
            }),
            system_fingerprint: zod.string()
        })
    }),
    error: zod.null()
});

export type BatchInputLine = zod.TypeOf<typeof BatchInputLine>;
export const BatchInputLine = zod.object({
    custom_id: zod.string(),
    method: zod.literal("POST"),
    url: zod.string(),
    body: zod.any()
});
