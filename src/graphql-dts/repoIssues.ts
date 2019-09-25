/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { LockReason } from "./globals";

// ====================================================
// GraphQL fragment: repoIssues
// ====================================================

export interface repoIssues_repository_issues_pageInfo {
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

export interface repoIssues_repository_issues_edges_node_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_milestone {
  __typename: "Milestone";
  id: string;
  /**
   * Identifies the title of the milestone.
   */
  title: string;
}

export interface repoIssues_repository_issues_edges_node_assignees_edges_node {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_assignees_edges {
  __typename: "UserEdge";
  /**
   * The item at the end of the edge.
   */
  node: repoIssues_repository_issues_edges_node_assignees_edges_node | null;
}

export interface repoIssues_repository_issues_edges_node_assignees {
  __typename: "UserConnection";
  /**
   * A list of edges.
   */
  edges: (repoIssues_repository_issues_edges_node_assignees_edges | null)[] | null;
}

export interface repoIssues_repository_issues_edges_node_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface repoIssues_repository_issues_edges_node_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface repoIssues_repository_issues_edges_node_labels_edges_node {
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

export interface repoIssues_repository_issues_edges_node_labels_edges {
  __typename: "LabelEdge";
  /**
   * The item at the end of the edge.
   */
  node: repoIssues_repository_issues_edges_node_labels_edges_node | null;
}

export interface repoIssues_repository_issues_edges_node_labels {
  __typename: "LabelConnection";
  /**
   * A list of edges.
   */
  edges: (repoIssues_repository_issues_edges_node_labels_edges | null)[] | null;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_pageInfo {
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

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_AddedToProjectEvent {
  __typename: "AddedToProjectEvent" | "CommentDeletedEvent" | "ConvertedNoteToIssueEvent" | "MarkedAsDuplicateEvent" | "MentionedEvent" | "MovedColumnsInProjectEvent" | "PinnedEvent" | "RemovedFromProjectEvent" | "UnpinnedEvent";
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment_author | null;
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
  thumbsUps: repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment_thumbsDowns;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_CrossReferencedEvent {
  __typename: "CrossReferencedEvent" | "ReferencedEvent" | "RenamedTitleEvent" | "SubscribedEvent" | "TransferredEvent" | "UnassignedEvent" | "UnlockedEvent" | "UserBlockedEvent" | "UnsubscribedEvent";
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_assignee_Bot {
  __typename: "Bot" | "Mannequin" | "Organization";
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_assignee_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_assignee = repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_assignee_Bot | repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_assignee_User;

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent {
  __typename: "AssignedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_actor | null;
  /**
   * Identifies the user or mannequin that was assigned.
   */
  assignee: repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent_assignee | null;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_ClosedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_ClosedEvent {
  __typename: "ClosedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_ClosedEvent_actor | null;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_DemilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_DemilestonedEvent {
  __typename: "DemilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_DemilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'demilestoned' event.
   */
  milestoneTitle: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_LabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_LabeledEvent_label {
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

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_LabeledEvent {
  __typename: "LabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_LabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'labeled' event.
   */
  label: repoIssues_repository_issues_edges_node_timelineItems_edges_node_LabeledEvent_label;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_LockedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_LockedEvent {
  __typename: "LockedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_LockedEvent_actor | null;
  /**
   * Reason that the conversation was locked (optional).
   */
  lockReason: LockReason | null;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_MilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_MilestonedEvent {
  __typename: "MilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_MilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'milestoned' event.
   */
  milestoneTitle: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_ReopenedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_ReopenedEvent_actor | null;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_UnlabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_UnlabeledEvent_label {
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

export interface repoIssues_repository_issues_edges_node_timelineItems_edges_node_UnlabeledEvent {
  __typename: "UnlabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: repoIssues_repository_issues_edges_node_timelineItems_edges_node_UnlabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'unlabeled' event.
   */
  label: repoIssues_repository_issues_edges_node_timelineItems_edges_node_UnlabeledEvent_label;
}

export type repoIssues_repository_issues_edges_node_timelineItems_edges_node = repoIssues_repository_issues_edges_node_timelineItems_edges_node_AddedToProjectEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_IssueComment | repoIssues_repository_issues_edges_node_timelineItems_edges_node_CrossReferencedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_AssignedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_ClosedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_DemilestonedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_LabeledEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_LockedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_MilestonedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_ReopenedEvent | repoIssues_repository_issues_edges_node_timelineItems_edges_node_UnlabeledEvent;

export interface repoIssues_repository_issues_edges_node_timelineItems_edges {
  __typename: "IssueTimelineItemsEdge";
  /**
   * The item at the end of the edge.
   */
  node: repoIssues_repository_issues_edges_node_timelineItems_edges_node | null;
}

export interface repoIssues_repository_issues_edges_node_timelineItems {
  __typename: "IssueTimelineItemsConnection";
  /**
   * Information to aid in pagination.
   */
  pageInfo: repoIssues_repository_issues_edges_node_timelineItems_pageInfo;
  /**
   * A list of edges.
   */
  edges: (repoIssues_repository_issues_edges_node_timelineItems_edges | null)[] | null;
}

export interface repoIssues_repository_issues_edges_node {
  __typename: "Issue";
  id: string;
  /**
   * Identifies the issue number.
   */
  number: number;
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the issue title.
   */
  title: string;
  /**
   * The HTTP URL for this issue
   */
  url: any;
  /**
   * The actor who authored the comment.
   */
  author: repoIssues_repository_issues_edges_node_author | null;
  /**
   * Identifies the body of the issue.
   */
  body: string;
  /**
   * `true` if the object is closed (definition of closed may depend on type)
   */
  closed: boolean;
  /**
   * `true` if the object is locked
   */
  locked: boolean;
  /**
   * Identifies the milestone associated with the issue.
   */
  milestone: repoIssues_repository_issues_edges_node_milestone | null;
  /**
   * A list of Users assigned to this object.
   */
  assignees: repoIssues_repository_issues_edges_node_assignees;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsUps: repoIssues_repository_issues_edges_node_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: repoIssues_repository_issues_edges_node_thumbsDowns;
  /**
   * A list of labels associated with the object.
   */
  labels: repoIssues_repository_issues_edges_node_labels | null;
  /**
   * A list of events, comments, commits, etc. associated with the issue.
   */
  timelineItems: repoIssues_repository_issues_edges_node_timelineItems;
}

export interface repoIssues_repository_issues_edges {
  __typename: "IssueEdge";
  /**
   * The item at the end of the edge.
   */
  node: repoIssues_repository_issues_edges_node | null;
}

export interface repoIssues_repository_issues {
  __typename: "IssueConnection";
  /**
   * Information to aid in pagination.
   */
  pageInfo: repoIssues_repository_issues_pageInfo;
  /**
   * A list of edges.
   */
  edges: (repoIssues_repository_issues_edges | null)[] | null;
}

export interface repoIssues_repository {
  __typename: "Repository";
  /**
   * A list of issues that have been opened in the repository.
   */
  issues: repoIssues_repository_issues;
}

export interface repoIssues {
  __typename: "Query";
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: repoIssues_repository | null;
}
