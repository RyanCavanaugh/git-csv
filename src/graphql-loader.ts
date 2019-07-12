export interface Issue {
    id: string;
    number: number;
    createdAt: Date;
    title: string;
    url: string;
    author: Login;
    body: string;
    closed: boolean;
    locked: boolean;
    milestone: Milestone | null;
    thumbsUps: number;
    thumbsDowns: number;
    labels: Label[];
    timelineItems: TimelineEvent[];
}

export interface Milestone {
    id: string;
    title: string;
}

export interface Label {
    id: string;
    name: string;
    color: string;
}

export interface Login {
    login: string;
}

export type TimelineEvent =
    | IssueCommentEvent
    | LabeledEvent
    | UnlabeledEvent
    | AssignedEvent
    | UnassignedEvent
    | MilestonedEvent
    | DemilestonedEvent
    | ClosedEvent
    | ReopenedEvent
    | LockedEvent
    | UnlockedEvent

export interface LabeledEvent {
    type: "LabeledEvent";
    createdAt: Date;
    actor: Login;
    label: Label;
}

export interface UnlabeledEvent {
    type: "UnlabeledEvent";
    createdAt: Date;
    actor: Login;
    label: Label;
}

export interface IssueCommentEvent {
    type: "IssueComment";
    id: string;
    author: Login;
    body: string;
    createdAt: Date;
    thumbsUps: number;
    thumbsDowns: number;
}

export interface AssignedEvent {
    type: "AssignedEvent";
    createdAt: Date;
    actor: Login;
    user: Login;
}

export interface UnassignedEvent {
    type: "UnassignedEvent";
    createdAt: Date;
    actor: Login;
    user: Login;
}

export interface MilestonedEvent {
    type: "MilestonedEvent";
    createdAt: Date;
    actor: Login;
    milestone: Milestone;
}

export interface DemilestonedEvent {
    type: "DemilestonedEvent";
    createdAt: Date;
    actor: Login;
    milestone: Milestone;
}

export interface ClosedEvent {
    type: "ClosedEvent";
    createdAt: Date;
    actor: Login;
}

export interface ReopenedEvent {
    type: "ReopenedEvent";
    createdAt: Date;
    actor: Login;
}

export interface LockedEvent {
    type: "LockedEvent";
    createdAt: Date;
    actor: Login;
    lockReason: string | null;
}

export interface UnlockedEvent {
    type: "UnlockedEvent";
    createdAt: Date;
    actor: Login;
}

export function loadIssueFromFileContent(jsonObject: object): Issue {
    const json: any = jsonObject;
    const { id, number, title, url, author, body, closed, locked, milestone } = json;

    return {
        id, number, title, url, author, body, closed, locked, milestone,
        createdAt: new Date(json.createdAt),
        thumbsUps: json.thumbsUps.totalCount,
        thumbsDowns: json.thumbsDowns.totalCount,
        labels: json.labels.edges.map((edge: any) => edge.node),
        timelineItems: json.timelineItems.edges.map(mapTimelineEvent)
    };
}

function mapTimelineEvent(itemObj: object): TimelineEvent {
    const item: any = (itemObj as any).node;
    const type = item.__typename as TimelineEvent["type"];
    switch (type) {
        case "AssignedEvent":
        case "UnassignedEvent":
            return {
                type,
                createdAt: new Date(item.createdAt),
                actor: item.actor,
                user: item.actor
            };

        case "ClosedEvent":
        case "ReopenedEvent":
            return {
                type,
                createdAt: new Date(item.createdAt),
                actor: item.actor
            };

        case "IssueComment":
            return {
                type,
                id: item.id,
                author: item.author,
                body: item.body,
                createdAt: new Date(item.createdAt),
                thumbsUps: item.thumbsUps.totalCount,
                thumbsDowns: item.thumbsDowns.totalCount
            };

        case "LabeledEvent":
        case "UnlabeledEvent":
            return {
                type,
                createdAt: new Date(item.createdAt),
                actor: item.actor,
                label: item.label
            };

        case "MilestonedEvent":
        case "DemilestonedEvent":
            return {
                type,
                createdAt: new Date(item.createdAt),
                milestone: item.milestone,
                actor: item.actor
            };

        case "LockedEvent":
            return {
                type,
                createdAt: new Date(item.createdAt),
                actor: item.actor,
                lockReason: item.lockReason
            };

        case "UnlockedEvent":
            return {
                type,
                createdAt: new Date(item.createdAt),
                actor: item.actor
            };

        default:
            return assertNever(type);
    }
}

function assertNever(s: never): never {
    throw new Error("Unsupported event " + s);
}