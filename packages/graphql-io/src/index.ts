import * as io from "io-ts";

export type Reactions = io.TypeOf<typeof Reactions>;
export const Reactions = io.readonlyArray(io.type({
    content: io.string,
    reactors: io.type({
        totalCount: io.number
    })
}));

export type Login = io.TypeOf<typeof Login>;
export const Login = io.type({
    login: io.string
});

export type Label = io.TypeOf<typeof Label>;
export const Label = io.type({
    id: io.string,
    name: io.string,
    color: io.string
});

export const ThumbCount = io.type({
    totalCount: io.number
});

export type AssignedEvent = io.TypeOf<typeof AssignedEvent>;
export const AssignedEvent = io.type({
    __typename: io.literal("AssignedEvent"),
    createdAt: io.string,
    actor: OrNull(Login),
    assignee: OrNull(Login)
});

export const ReopenedEvent = io.type({
    __typename: io.literal("ReopenedEvent"),
    createdAt: io.string,
    actor: OrNull(Login),
});

export const LabeledEvent = io.type({
    __typename: io.literal("LabeledEvent"),
    createdAt: io.string,
    actor: Login,
    label: Label
});

export const UnlabeledEvent = io.type({
    __typename: io.literal("UnlabeledEvent"),
    createdAt: io.string,
    actor: Login,
    label: Label
});

export type IssueCommentEvent = io.TypeOf<typeof IssueCommentEvent>;
export const IssueCommentEvent = io.type({
    __typename: io.literal("IssueComment"),
    id: io.string,
    author: OrNull(Login),
    url: io.string,
    body: io.string,
    bodyHTML: io.string,
    createdAt: io.string,
    reactionGroups: Reactions
});

export const ClosedEvent = io.type({
    __typename: io.literal("ClosedEvent"),
    createdAt: io.string,
    actor: OrNull(Login)
});

export const MilestonedEvent = io.type({
    __typename: io.literal("MilestonedEvent"),
    createdAt: io.string,
    actor: Login,
    milestoneTitle: io.string
});

export const DemilestonedEvent = io.type({
    __typename: io.literal("DemilestonedEvent"),
    createdAt: io.string,
    actor: Login,
    milestoneTitle: io.string
});

export const LockedEvent = io.type({
    __typename: io.literal("LockedEvent"),
    createdAt: io.string,
    actor: Login,
    lockReason: io.union([io.null, io.string])
});

export const UnlockedEvent = io.type({
    __typename: io.literal("UnlockedEvent")
});

export type TimelineItem = io.TypeOf<typeof TimelineItem>;
export const TimelineItem = io.union([
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

export type Issue = io.TypeOf<typeof Issue>;
export const Issue = io.type({
    id: io.string,
    number: io.number,
    createdAt: io.string,
    updatedAt: io.string,
    title: io.string,
    url: io.string,
    author: OrNull(Login),
    body: io.string,
    closed: io.boolean,
    locked: io.boolean,
    milestone: OrNull(io.type({
        id: io.string,
        title: io.string
    })),
    assignees: ArrayOfNodes(Login),
    reactionGroups: Reactions,

    labels: ArrayOfNodes(Label),
    timelineItems: ArrayOfNodes(TimelineItem)
} as const);

export function OtherEventType<const T extends string>(s: T) {
    return io.type({
        __typename: io.literal(s)
    });
}

export function ArrayOfNodes<T extends io.Type<any, any, any>>(type: T) {
    return io.type({
        nodes: io.readonlyArray(
            io.union([io.null, type])
        )
    });
}

export function OrNull<T extends io.Type<any, any, any>>(type: T) {
    return io.union([io.null, type]);
}

