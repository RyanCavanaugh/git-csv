/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PullRequestState, CommentAuthorAssociation, PullRequestReviewState, LockReason } from "./globals.js";

// ====================================================
// GraphQL query operation: prs
// ====================================================

export interface prs_repository_pullRequests_pageInfo {
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

export interface prs_repository_pullRequests_edges_node_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_milestone {
  __typename: "Milestone";
  id: string;
  /**
   * Identifies the title of the milestone.
   */
  title: string;
}

export interface prs_repository_pullRequests_edges_node_assignees_edges_node {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_assignees_edges {
  __typename: "UserEdge";
  /**
   * The item at the end of the edge.
   */
  node: prs_repository_pullRequests_edges_node_assignees_edges_node | null;
}

export interface prs_repository_pullRequests_edges_node_assignees {
  __typename: "UserConnection";
  /**
   * A list of edges.
   */
  edges: (prs_repository_pullRequests_edges_node_assignees_edges | null)[] | null;
}

export interface prs_repository_pullRequests_edges_node_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prs_repository_pullRequests_edges_node_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prs_repository_pullRequests_edges_node_labels_edges_node {
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

export interface prs_repository_pullRequests_edges_node_labels_edges {
  __typename: "LabelEdge";
  /**
   * The item at the end of the edge.
   */
  node: prs_repository_pullRequests_edges_node_labels_edges_node | null;
}

export interface prs_repository_pullRequests_edges_node_labels {
  __typename: "LabelConnection";
  /**
   * A list of edges.
   */
  edges: (prs_repository_pullRequests_edges_node_labels_edges | null)[] | null;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_pageInfo {
  __typename: "PageInfo";
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestCommit {
  __typename: "PullRequestCommit" | "PullRequestCommitCommentThread" | "PullRequestReviewThread" | "PullRequestRevisionMarker" | "BaseRefChangedEvent" | "BaseRefForcePushedEvent" | "DeployedEvent" | "DeploymentEnvironmentChangedEvent" | "HeadRefDeletedEvent" | "HeadRefForcePushedEvent" | "HeadRefRestoredEvent" | "MergedEvent" | "ReviewDismissedEvent" | "ReviewRequestRemovedEvent" | "ReadyForReviewEvent" | "CrossReferencedEvent" | "AddedToProjectEvent" | "CommentDeletedEvent" | "ConvertedNoteToIssueEvent" | "MarkedAsDuplicateEvent" | "MentionedEvent" | "MovedColumnsInProjectEvent" | "PinnedEvent" | "ReferencedEvent" | "RemovedFromProjectEvent" | "RenamedTitleEvent" | "SubscribedEvent" | "TransferredEvent" | "UnassignedEvent" | "UnlockedEvent" | "UserBlockedEvent" | "UnpinnedEvent" | "UnsubscribedEvent";
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview_author | null;
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
  thumbsUps: prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview_thumbsDowns;
  /**
   * Identifies the current state of the pull request review.
   */
  reviewState: PullRequestReviewState;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_Team {
  __typename: "Team" | "Mannequin";
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer = prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_Team | prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer_User;

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent {
  __typename: "ReviewRequestedEvent";
  id: string;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_actor | null;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the reviewer whose review was requested.
   */
  requestedReviewer: prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent_requestedReviewer | null;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment_author | null;
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
  thumbsUps: prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment_thumbsDowns;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_assignee_Bot {
  __typename: "Bot" | "Mannequin" | "Organization";
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_assignee_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_assignee = prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_assignee_Bot | prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_assignee_User;

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent {
  __typename: "AssignedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_actor | null;
  /**
   * Identifies the user or mannequin that was assigned.
   */
  assignee: prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent_assignee | null;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_LabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_LabeledEvent_label {
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

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_LabeledEvent {
  __typename: "LabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_LabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'labeled' event.
   */
  label: prs_repository_pullRequests_edges_node_timelineItems_edges_node_LabeledEvent_label;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_UnlabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_UnlabeledEvent_label {
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

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_UnlabeledEvent {
  __typename: "UnlabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_UnlabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'unlabeled' event.
   */
  label: prs_repository_pullRequests_edges_node_timelineItems_edges_node_UnlabeledEvent_label;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ClosedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ClosedEvent {
  __typename: "ClosedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_ClosedEvent_actor | null;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReopenedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReopenedEvent_actor | null;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_MilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_MilestonedEvent {
  __typename: "MilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_MilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'milestoned' event.
   */
  milestoneTitle: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_DemilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_DemilestonedEvent {
  __typename: "DemilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_DemilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'demilestoned' event.
   */
  milestoneTitle: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_LockedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prs_repository_pullRequests_edges_node_timelineItems_edges_node_LockedEvent {
  __typename: "LockedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prs_repository_pullRequests_edges_node_timelineItems_edges_node_LockedEvent_actor | null;
  /**
   * Reason that the conversation was locked (optional).
   */
  lockReason: LockReason | null;
}

export type prs_repository_pullRequests_edges_node_timelineItems_edges_node = prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestCommit | prs_repository_pullRequests_edges_node_timelineItems_edges_node_PullRequestReview | prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReviewRequestedEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_IssueComment | prs_repository_pullRequests_edges_node_timelineItems_edges_node_AssignedEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_LabeledEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_UnlabeledEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_ClosedEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_ReopenedEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_MilestonedEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_DemilestonedEvent | prs_repository_pullRequests_edges_node_timelineItems_edges_node_LockedEvent;

export interface prs_repository_pullRequests_edges_node_timelineItems_edges {
  __typename: "PullRequestTimelineItemsEdge";
  /**
   * The item at the end of the edge.
   */
  node: prs_repository_pullRequests_edges_node_timelineItems_edges_node | null;
}

export interface prs_repository_pullRequests_edges_node_timelineItems {
  __typename: "PullRequestTimelineItemsConnection";
  /**
   * Information to aid in pagination.
   */
  pageInfo: prs_repository_pullRequests_edges_node_timelineItems_pageInfo;
  /**
   * A list of edges.
   */
  edges: (prs_repository_pullRequests_edges_node_timelineItems_edges | null)[] | null;
}

export interface prs_repository_pullRequests_edges_node {
  __typename: "PullRequest";
  id: string;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * The HTTP URL for this pull request.
   */
  url: any;
  /**
   * The actor who authored the comment.
   */
  author: prs_repository_pullRequests_edges_node_author | null;
  /**
   * The body as Markdown.
   */
  body: string;
  /**
   * `true` if the pull request is closed
   */
  closed: boolean;
  /**
   * `true` if the pull request is locked
   */
  locked: boolean;
  /**
   * Identifies the milestone associated with the pull request.
   */
  milestone: prs_repository_pullRequests_edges_node_milestone | null;
  /**
   * A list of Users assigned to this object.
   */
  assignees: prs_repository_pullRequests_edges_node_assignees;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsUps: prs_repository_pullRequests_edges_node_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: prs_repository_pullRequests_edges_node_thumbsDowns;
  /**
   * A list of labels associated with the object.
   */
  labels: prs_repository_pullRequests_edges_node_labels | null;
  /**
   * A list of events, comments, commits, etc. associated with the pull request.
   */
  timelineItems: prs_repository_pullRequests_edges_node_timelineItems;
}

export interface prs_repository_pullRequests_edges {
  __typename: "PullRequestEdge";
  /**
   * The item at the end of the edge.
   */
  node: prs_repository_pullRequests_edges_node | null;
}

export interface prs_repository_pullRequests {
  __typename: "PullRequestConnection";
  /**
   * Information to aid in pagination.
   */
  pageInfo: prs_repository_pullRequests_pageInfo;
  /**
   * A list of edges.
   */
  edges: (prs_repository_pullRequests_edges | null)[] | null;
}

export interface prs_repository {
  __typename: "Repository";
  /**
   * A list of pull requests that have been opened in the repository.
   */
  pullRequests: prs_repository_pullRequests;
}

export interface prs_rateLimit {
  __typename: "RateLimit";
  /**
   * The point cost for the current query counting against the rate limit.
   */
  cost: number;
  /**
   * The maximum number of points the client is permitted to consume in a 60 minute window.
   */
  limit: number;
  /**
   * The number of points remaining in the current rate limit window.
   */
  remaining: number;
  /**
   * The time at which the current rate limit window resets in UTC epoch seconds.
   */
  resetAt: any;
}

export interface prs {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: prs_repository | null;
  /**
   * The client's rate limit information.
   */
  rateLimit: prs_rateLimit | null;
}

export interface prsVariables {
  owner: string;
  repoName: string;
  itemsPerPage?: number | null;
  cursor?: string | null;
  states?: PullRequestState[] | null;
}
