export namespace TimelineItemsResult {
    export interface Root {
        data: {
            repository: {
                issue: {
                    timelineItems: RepoIssuesResult.TimelineItems;
                }
            }
        }
    }
}

export namespace RepoIssuesResult {
    export interface Root {
        data: Data;
    }

    export interface Data {
        repository: Repository;
    }

    export interface Repository {
        issues: Issues;
    }

    export interface Issues {
        pageInfo: PageInfo;
        edges: IssuesEdge[];
    }

    export interface IssuesEdge {
        node: Issue;
    }

    export interface Issue {
        id: string;
        number: number;
        title: string;
        url: string;
        author: Author;
        body: string;
        closed: boolean;
        locked: boolean;
        milestone: Milestone | null;
        thumbsUps: Thumbs;
        thumbsDowns: Thumbs;
        labels: Labels;
        timelineItems: TimelineItems;
    }

    export interface Milestone {
        id: string;
        title: string;
    }

    export interface Author {
        login: string;
    }

    export interface Labels {
        edges: LabelsEdge[];
    }

    export interface LabelsEdge {
        node: LabelClass;
    }

    export interface LabelClass {
        id: string;
        name: string;
        color: string;
    }

    export interface Thumbs {
        totalCount: number;
    }

    export interface TimelineItems {
        pageInfo: PageInfo;
        edges: TimelineItemsEdge[];
    }

    export interface TimelineItemsEdge {
        node: TimelineItem;
    }

    export interface TimelineItem {
        __typename?: Typename;
        createdAt?: Date;
        actor?: Author;
        label?: LabelClass;
        id?: string;
        author?: Author | null;
        body?: string;
        thumbsUps?: Thumbs;
        thumbsDowns?: Thumbs;
        lockReason?: null;
    }

    export enum Typename {
        ClosedEvent = "ClosedEvent",
        CrossReferencedEvent = "CrossReferencedEvent",
        IssueComment = "IssueComment",
        LabeledEvent = "LabeledEvent",
        LockedEvent = "LockedEvent",
        SubscribedEvent = "SubscribedEvent",
        UnlabeledEvent = "UnlabeledEvent",
    }

    export interface PageInfo {
        endCursor: string;
        hasNextPage: boolean;
    }
}
