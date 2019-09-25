/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CommentAuthorAssociation, PullRequestReviewState, LockReason } from "./globals";

// ====================================================
// GraphQL query operation: morePrTimelineItems
// ====================================================

export interface morePrTimelineItems_repository_pullRequest_timelineItems_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestCommit {
  __typename: "PullRequestCommit" | "PullRequestCommitCommentThread" | "PullRequestReviewThread" | "PullRequestRevisionMarker" | "BaseRefChangedEvent" | "BaseRefForcePushedEvent" | "DeployedEvent" | "DeploymentEnvironmentChangedEvent" | "HeadRefDeletedEvent" | "HeadRefForcePushedEvent" | "HeadRefRestoredEvent" | "MergedEvent" | "ReviewDismissedEvent" | "ReviewRequestRemovedEvent" | "ReadyForReviewEvent" | "CrossReferencedEvent" | "AddedToProjectEvent" | "CommentDeletedEvent" | "ConvertedNoteToIssueEvent" | "MarkedAsDuplicateEvent" | "MentionedEvent" | "MovedColumnsInProjectEvent" | "PinnedEvent" | "ReferencedEvent" | "RemovedFromProjectEvent" | "RenamedTitleEvent" | "SubscribedEvent" | "TransferredEvent" | "UnassignedEvent" | "UnlockedEvent" | "UserBlockedEvent" | "UnpinnedEvent" | "UnsubscribedEvent";
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview_author | null;
  /**
   * Author's association with the subject of the comment.
   */
  authorAssociation: CommentAuthorAssociation;
  /**
   * Identifies the pull request review body.
   */
  body: string;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsUps: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview_thumbsDowns;
  /**
   * Identifies the current state of the pull request review.
   */
  reviewState: PullRequestReviewState;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_Team {
  __typename: "Team" | "Mannequin";
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer = morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_Team | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_User;

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent {
  __typename: "ReviewRequestedEvent";
  id: string;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_actor | null;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the reviewer whose review was requested.
   */
  requestedReviewer: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer | null;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment_author | null;
  /**
   * The body as Markdown.
   */
  body: string;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsUps: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment_thumbsDowns;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_assignee_Bot {
  __typename: "Bot" | "Mannequin" | "Organization";
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_assignee_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_assignee = morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_assignee_Bot | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_assignee_User;

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent {
  __typename: "AssignedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_actor | null;
  /**
   * Identifies the user or mannequin that was assigned.
   */
  assignee: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent_assignee | null;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LabeledEvent_label {
  __typename: "Label";
  id: string;
  /**
   * Identifies the label name.
   */
  name: string;
  /**
   * Identifies the label color.
   */
  color: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LabeledEvent {
  __typename: "LabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'labeled' event.
   */
  label: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LabeledEvent_label;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_UnlabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_UnlabeledEvent_label {
  __typename: "Label";
  id: string;
  /**
   * Identifies the label name.
   */
  name: string;
  /**
   * Identifies the label color.
   */
  color: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_UnlabeledEvent {
  __typename: "UnlabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_UnlabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'unlabeled' event.
   */
  label: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_UnlabeledEvent_label;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ClosedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ClosedEvent {
  __typename: "ClosedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ClosedEvent_actor | null;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReopenedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReopenedEvent_actor | null;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_MilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_MilestonedEvent {
  __typename: "MilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_MilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'milestoned' event.
   */
  milestoneTitle: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_DemilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_DemilestonedEvent {
  __typename: "DemilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_DemilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'demilestoned' event.
   */
  milestoneTitle: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LockedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LockedEvent {
  __typename: "LockedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LockedEvent_actor | null;
  /**
   * Reason that the conversation was locked (optional).
   */
  lockReason: LockReason | null;
}

export type morePrTimelineItems_repository_pullRequest_timelineItems_edges_node = morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestCommit | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_PullRequestReview | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReviewRequestedEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_IssueComment | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_AssignedEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LabeledEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_UnlabeledEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ClosedEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_ReopenedEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_MilestonedEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_DemilestonedEvent | morePrTimelineItems_repository_pullRequest_timelineItems_edges_node_LockedEvent;

export interface morePrTimelineItems_repository_pullRequest_timelineItems_edges {
  __typename: "PullRequestTimelineItemsEdge";
  /**
   * The item at the end of the edge.
   */
  node: morePrTimelineItems_repository_pullRequest_timelineItems_edges_node | null;
}

export interface morePrTimelineItems_repository_pullRequest_timelineItems {
  __typename: "PullRequestTimelineItemsConnection";
  /**
   * Information to aid in pagination.
   */
  pageInfo: morePrTimelineItems_repository_pullRequest_timelineItems_pageInfo;
  /**
   * A list of edges.
   */
  edges: (morePrTimelineItems_repository_pullRequest_timelineItems_edges | null)[] | null;
}

export interface morePrTimelineItems_repository_pullRequest {
  __typename: "PullRequest";
  /**
   * A list of events, comments, commits, etc. associated with the pull request.
   */
  timelineItems: morePrTimelineItems_repository_pullRequest_timelineItems;
}

export interface morePrTimelineItems_repository {
  __typename: "Repository";
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: morePrTimelineItems_repository_pullRequest | null;
}

export interface morePrTimelineItems {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: morePrTimelineItems_repository | null;
}

export interface morePrTimelineItemsVariables {
  owner: string;
  repoName: string;
  issueNumber: number;
  cursor?: string | null;
}
