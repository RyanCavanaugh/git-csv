/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { CommentAuthorAssociation, PullRequestReviewState, LockReason } from "./globals.js";

// ====================================================
// GraphQL fragment: prTimelineItem
// ====================================================

export interface prTimelineItem_PullRequestCommit {
  __typename: "PullRequestCommit" | "PullRequestCommitCommentThread" | "PullRequestReviewThread" | "PullRequestRevisionMarker" | "BaseRefChangedEvent" | "BaseRefForcePushedEvent" | "DeployedEvent" | "DeploymentEnvironmentChangedEvent" | "HeadRefDeletedEvent" | "HeadRefForcePushedEvent" | "HeadRefRestoredEvent" | "MergedEvent" | "ReviewDismissedEvent" | "ReviewRequestRemovedEvent" | "ReadyForReviewEvent" | "CrossReferencedEvent" | "AddedToProjectEvent" | "CommentDeletedEvent" | "ConvertedNoteToIssueEvent" | "MarkedAsDuplicateEvent" | "MentionedEvent" | "MovedColumnsInProjectEvent" | "PinnedEvent" | "ReferencedEvent" | "RemovedFromProjectEvent" | "RenamedTitleEvent" | "SubscribedEvent" | "TransferredEvent" | "UnassignedEvent" | "UnlockedEvent" | "UserBlockedEvent" | "UnpinnedEvent" | "UnsubscribedEvent";
}

export interface prTimelineItem_PullRequestReview_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_PullRequestReview_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prTimelineItem_PullRequestReview_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prTimelineItem_PullRequestReview {
  __typename: "PullRequestReview";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: prTimelineItem_PullRequestReview_author | null;
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
  thumbsUps: prTimelineItem_PullRequestReview_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: prTimelineItem_PullRequestReview_thumbsDowns;
  /**
   * Identifies the current state of the pull request review.
   */
  reviewState: PullRequestReviewState;
}

export interface prTimelineItem_ReviewRequestedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_ReviewRequestedEvent_requestedReviewer_Team {
  __typename: "Team" | "Mannequin";
}

export interface prTimelineItem_ReviewRequestedEvent_requestedReviewer_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type prTimelineItem_ReviewRequestedEvent_requestedReviewer = prTimelineItem_ReviewRequestedEvent_requestedReviewer_Team | prTimelineItem_ReviewRequestedEvent_requestedReviewer_User;

export interface prTimelineItem_ReviewRequestedEvent {
  __typename: "ReviewRequestedEvent";
  id: string;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_ReviewRequestedEvent_actor | null;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the reviewer whose review was requested.
   */
  requestedReviewer: prTimelineItem_ReviewRequestedEvent_requestedReviewer | null;
}

export interface prTimelineItem_IssueComment_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_IssueComment_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prTimelineItem_IssueComment_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface prTimelineItem_IssueComment {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: prTimelineItem_IssueComment_author | null;
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
  thumbsUps: prTimelineItem_IssueComment_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: prTimelineItem_IssueComment_thumbsDowns;
}

export interface prTimelineItem_AssignedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_AssignedEvent_assignee_Bot {
  __typename: "Bot" | "Mannequin" | "Organization";
}

export interface prTimelineItem_AssignedEvent_assignee_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type prTimelineItem_AssignedEvent_assignee = prTimelineItem_AssignedEvent_assignee_Bot | prTimelineItem_AssignedEvent_assignee_User;

export interface prTimelineItem_AssignedEvent {
  __typename: "AssignedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_AssignedEvent_actor | null;
  /**
   * Identifies the user or mannequin that was assigned.
   */
  assignee: prTimelineItem_AssignedEvent_assignee | null;
}

export interface prTimelineItem_LabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_LabeledEvent_label {
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

export interface prTimelineItem_LabeledEvent {
  __typename: "LabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_LabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'labeled' event.
   */
  label: prTimelineItem_LabeledEvent_label;
}

export interface prTimelineItem_UnlabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_UnlabeledEvent_label {
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

export interface prTimelineItem_UnlabeledEvent {
  __typename: "UnlabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_UnlabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'unlabeled' event.
   */
  label: prTimelineItem_UnlabeledEvent_label;
}

export interface prTimelineItem_ClosedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_ClosedEvent {
  __typename: "ClosedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_ClosedEvent_actor | null;
}

export interface prTimelineItem_ReopenedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_ReopenedEvent_actor | null;
}

export interface prTimelineItem_MilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_MilestonedEvent {
  __typename: "MilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_MilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'milestoned' event.
   */
  milestoneTitle: string;
}

export interface prTimelineItem_DemilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_DemilestonedEvent {
  __typename: "DemilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_DemilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'demilestoned' event.
   */
  milestoneTitle: string;
}

export interface prTimelineItem_LockedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface prTimelineItem_LockedEvent {
  __typename: "LockedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: prTimelineItem_LockedEvent_actor | null;
  /**
   * Reason that the conversation was locked (optional).
   */
  lockReason: LockReason | null;
}

export type prTimelineItem = prTimelineItem_PullRequestCommit | prTimelineItem_PullRequestReview | prTimelineItem_ReviewRequestedEvent | prTimelineItem_IssueComment | prTimelineItem_AssignedEvent | prTimelineItem_LabeledEvent | prTimelineItem_UnlabeledEvent | prTimelineItem_ClosedEvent | prTimelineItem_ReopenedEvent | prTimelineItem_MilestonedEvent | prTimelineItem_DemilestonedEvent | prTimelineItem_LockedEvent;
