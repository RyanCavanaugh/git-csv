import * as z from "zod";

export type Reactions = z.TypeOf<typeof Reactions>;
export const Reactions = z.array(z.object({
    content: z.string(),
    reactors: z.object({
        totalCount: z.number()
    })
})).readonly();

export type Login = z.TypeOf<typeof Login>;
export const Login = z.object({
    login: z.string()
});

export type Label = z.TypeOf<typeof Label>;
export const Label = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string()
});

export const ThumbCount = z.object({
    totalCount: z.number()
});

export type AssignedEvent = z.TypeOf<typeof AssignedEvent>;
export const AssignedEvent = z.object({
    __typename: z.literal("AssignedEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
    assignee: OrNull(Login)
});

export const ReopenedEvent = z.object({
    __typename: z.literal("ReopenedEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
});

export const LabeledEvent = z.object({
    __typename: z.literal("LabeledEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
    label: Label
});

export const UnlabeledEvent = z.object({
    __typename: z.literal("UnlabeledEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
    label: Label
});

export type IssueCommentEvent = z.TypeOf<typeof IssueCommentEvent>;
export const IssueCommentEvent = z.object({
    __typename: z.literal("IssueComment"),
    id: z.string(),
    author: OrNull(Login),
    url: z.string(),
    body: z.string(),
    bodyHTML: z.string(),
    createdAt: z.string(),
    reactionGroups: Reactions
});

export const ClosedEvent = z.object({
    __typename: z.literal("ClosedEvent"),
    createdAt: z.string(),
    actor: OrNull(Login)
});

export const MilestonedEvent = z.object({
    __typename: z.literal("MilestonedEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
    milestoneTitle: z.string()
});

export const DemilestonedEvent = z.object({
    __typename: z.literal("DemilestonedEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
    milestoneTitle: z.string()
});

export const LockedEvent = z.object({
    __typename: z.literal("LockedEvent"),
    createdAt: z.string(),
    actor: OrNull(Login),
    lockReason: z.union([z.null(), z.string()])
});

export const UnlockedEvent = z.object({
    __typename: z.literal("UnlockedEvent")
});

export type TimelineItem = z.TypeOf<typeof TimelineItem>;
export const TimelineItem = z.union([
    AssignedEvent,
    ReopenedEvent,
    LabeledEvent,
    UnlabeledEvent,
    IssueCommentEvent,
    ClosedEvent,
    MilestonedEvent,
    DemilestonedEvent,
    LockedEvent,
    UnlockedEvent,
    OtherEventType("MentionedEvent"),
    OtherEventType("SubscribedEvent"),
    OtherEventType("UnsubscribedEvent"),
    OtherEventType("PullRequestReviewThread"),
    OtherEventType("PullRequestCommit"),
    OtherEventType("ReviewDismissedEvent"),
    OtherEventType("ReviewRequestedEvent"),
    OtherEventType("ReviewRequestRemovedEvent"),
    OtherEventType("HeadRefForcePushedEvent"),
    OtherEventType("CommentDeletedEvent"),
    OtherEventType("ConvertToDraftEvent"),
    OtherEventType("ReadyForReviewEvent"),
    OtherEventType("ReferencedEvent"),
    OtherEventType("MergedEvent"),
    OtherEventType("HeadRefDeletedEvent"),
    OtherEventType("HeadRefRestoredEvent"),
    OtherEventType("CrossReferencedEvent"),
    OtherEventType("UnassignedEvent"),
    OtherEventType("RenamedTitleEvent"),
    OtherEventType("BaseRefChangedEvent"),
    OtherEventType("BaseRefForcePushedEvent"),
    OtherEventType("BaseRefDeletedEvent"),
    OtherEventType("AutomaticBaseChangeSucceededEvent"),
    OtherEventType("PullRequestReview"),
    OtherEventType("ConnectedEvent"),
    OtherEventType("MarkedAsDuplicateEvent"),
]);

/*
  "closedByPullRequestsReferences": {
    "nodes": [
      {
        "number": 610,
        "updatedAt": "2018-06-18T18:38:23Z",
        "merged": true,
        "mergedAt": "2014-09-05T22:43:44Z"
      }
    ]
  }
*/

export type ReferencedPullRequest = z.TypeOf<typeof ReferencedPullRequest>;
export const ReferencedPullRequest = z.object({
    number: z.number(),
    updatedAt: z.string(),
    merged: z.boolean(),
    mergedAt: OrNull(z.string())
});

export type IssueOrPullRequest = z.TypeOf<typeof IssueOrPullRequest>;
export const IssueOrPullRequest = z.object({
    id: z.string(),
    number: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    title: z.string(),
    url: z.string(),
    author: OrNull(Login),
    body: z.string(),
    closed: z.boolean(),
    locked: z.boolean(),
    activeLockReason: z.union([z.null(), z.literal("RESOLVED"), z.literal("TOO_HEATED"), z.literal("OFF_TOPIC"), z.literal("SPAM")]),
    milestone: OrNull(z.object({
        id: z.string(),
        title: z.string()
    })),
    assignees: ArrayOfNodes(Login),
    reactionGroups: Reactions,
    labels: ArrayOfNodes(Label),
    timelineItems: ArrayOfNodes(TimelineItem)
});

export type PullRequest = z.TypeOf<typeof PullRequest>;
export const PullRequest = IssueOrPullRequest;

export type Issue = z.TypeOf<typeof Issue>;
export const Issue = z.intersection(IssueOrPullRequest, z.object({
    stateReason: z.union([z.null(), z.literal("COMPLETED"), z.literal("NOT_PLANNED"), z.literal("REOPENED")]),
    closedByPullRequestsReferences: ArrayOfNodes(ReferencedPullRequest),
}));

export function OtherEventType<const T extends string>(s: T) {
    return z.object({
        __typename: z.literal(s)
    });
}

export function ArrayOfNodes<T extends z.ZodTypeAny>(type: T) {
    return z.object({
        nodes: z.array(
            z.union([z.null(), type])
        )
    });
}

export function OrNull<T extends z.ZodTypeAny>(type: T) {
    return z.union([z.null(), type]);
}

