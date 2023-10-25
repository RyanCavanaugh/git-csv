/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { LockReason } from "./globals.js";

// ====================================================
// GraphQL fragment: issueTimelineItem
// ====================================================

export interface issueTimelineItem_Commit {
  __typename: "Commit" | "CrossReferencedEvent" | "SubscribedEvent" | "UnsubscribedEvent" | "ReferencedEvent" | "UnassignedEvent" | "UserBlockedEvent" | "RenamedTitleEvent" | "UnlockedEvent" | "TransferredEvent";
}

export interface issueTimelineItem_IssueComment_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_IssueComment_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface issueTimelineItem_IssueComment_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface issueTimelineItem_IssueComment {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: issueTimelineItem_IssueComment_author | null;
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
  thumbsUps: issueTimelineItem_IssueComment_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: issueTimelineItem_IssueComment_thumbsDowns;
}

export interface issueTimelineItem_AssignedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_AssignedEvent_assignee_Bot {
  __typename: "Bot" | "Mannequin" | "Organization";
}

export interface issueTimelineItem_AssignedEvent_assignee_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type issueTimelineItem_AssignedEvent_assignee = issueTimelineItem_AssignedEvent_assignee_Bot | issueTimelineItem_AssignedEvent_assignee_User;

export interface issueTimelineItem_AssignedEvent {
  __typename: "AssignedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_AssignedEvent_actor | null;
  /**
   * Identifies the user or mannequin that was assigned.
   */
  assignee: issueTimelineItem_AssignedEvent_assignee | null;
}

export interface issueTimelineItem_LabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_LabeledEvent_label {
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

export interface issueTimelineItem_LabeledEvent {
  __typename: "LabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_LabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'labeled' event.
   */
  label: issueTimelineItem_LabeledEvent_label;
}

export interface issueTimelineItem_UnlabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_UnlabeledEvent_label {
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

export interface issueTimelineItem_UnlabeledEvent {
  __typename: "UnlabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_UnlabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'unlabeled' event.
   */
  label: issueTimelineItem_UnlabeledEvent_label;
}

export interface issueTimelineItem_ClosedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_ClosedEvent {
  __typename: "ClosedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_ClosedEvent_actor | null;
}

export interface issueTimelineItem_ReopenedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_ReopenedEvent_actor | null;
}

export interface issueTimelineItem_MilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_MilestonedEvent {
  __typename: "MilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_MilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'milestoned' event.
   */
  milestoneTitle: string;
}

export interface issueTimelineItem_DemilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_DemilestonedEvent {
  __typename: "DemilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_DemilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'demilestoned' event.
   */
  milestoneTitle: string;
}

export interface issueTimelineItem_LockedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface issueTimelineItem_LockedEvent {
  __typename: "LockedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: issueTimelineItem_LockedEvent_actor | null;
  /**
   * Reason that the conversation was locked (optional).
   */
  lockReason: LockReason | null;
}

export type issueTimelineItem = issueTimelineItem_Commit | issueTimelineItem_IssueComment | issueTimelineItem_AssignedEvent | issueTimelineItem_LabeledEvent | issueTimelineItem_UnlabeledEvent | issueTimelineItem_ClosedEvent | issueTimelineItem_ReopenedEvent | issueTimelineItem_MilestonedEvent | issueTimelineItem_DemilestonedEvent | issueTimelineItem_LockedEvent;
