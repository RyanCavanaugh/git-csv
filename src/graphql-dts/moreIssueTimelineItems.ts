/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { LockReason } from "./globals";

// ====================================================
// GraphQL query operation: moreIssueTimelineItems
// ====================================================

export interface moreIssueTimelineItems_repository_issue_timelineItems_pageInfo {
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

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AddedToProjectEvent {
  __typename: "AddedToProjectEvent" | "CommentDeletedEvent" | "ConvertedNoteToIssueEvent" | "MarkedAsDuplicateEvent" | "MentionedEvent" | "MovedColumnsInProjectEvent" | "PinnedEvent" | "RemovedFromProjectEvent" | "UnpinnedEvent";
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment_author {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment_thumbsUps {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment_thumbsDowns {
  __typename: "ReactionConnection";
  /**
   * Identifies the total count of items in the connection.
   */
  totalCount: number;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment {
  __typename: "IssueComment";
  id: string;
  /**
   * The actor who authored the comment.
   */
  author: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment_author | null;
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
  thumbsUps: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment_thumbsUps;
  /**
   * A list of Reactions left on the Issue.
   */
  thumbsDowns: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment_thumbsDowns;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_CrossReferencedEvent {
  __typename: "CrossReferencedEvent" | "ReferencedEvent" | "RenamedTitleEvent" | "SubscribedEvent" | "TransferredEvent" | "UnassignedEvent" | "UnlockedEvent" | "UserBlockedEvent" | "UnsubscribedEvent";
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_assignee_Bot {
  __typename: "Bot" | "Mannequin" | "Organization";
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_assignee_User {
  __typename: "User";
  /**
   * The username used to login.
   */
  login: string;
}

export type moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_assignee = moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_assignee_Bot | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_assignee_User;

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent {
  __typename: "AssignedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_actor | null;
  /**
   * Identifies the user or mannequin that was assigned.
   */
  assignee: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent_assignee | null;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ClosedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ClosedEvent {
  __typename: "ClosedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ClosedEvent_actor | null;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_DemilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_DemilestonedEvent {
  __typename: "DemilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_DemilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'demilestoned' event.
   */
  milestoneTitle: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LabeledEvent_label {
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

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LabeledEvent {
  __typename: "LabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'labeled' event.
   */
  label: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LabeledEvent_label;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LockedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LockedEvent {
  __typename: "LockedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LockedEvent_actor | null;
  /**
   * Reason that the conversation was locked (optional).
   */
  lockReason: LockReason | null;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_MilestonedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_MilestonedEvent {
  __typename: "MilestonedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_MilestonedEvent_actor | null;
  /**
   * Identifies the milestone title associated with the 'milestoned' event.
   */
  milestoneTitle: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ReopenedEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ReopenedEvent {
  __typename: "ReopenedEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ReopenedEvent_actor | null;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_UnlabeledEvent_actor {
  __typename: "Organization" | "User" | "Mannequin" | "Bot";
  /**
   * The username of the actor.
   */
  login: string;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_UnlabeledEvent_label {
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

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges_node_UnlabeledEvent {
  __typename: "UnlabeledEvent";
  /**
   * Identifies the date and time when the object was created.
   */
  createdAt: any;
  /**
   * Identifies the actor who performed the event.
   */
  actor: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_UnlabeledEvent_actor | null;
  /**
   * Identifies the label associated with the 'unlabeled' event.
   */
  label: moreIssueTimelineItems_repository_issue_timelineItems_edges_node_UnlabeledEvent_label;
}

export type moreIssueTimelineItems_repository_issue_timelineItems_edges_node = moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AddedToProjectEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_IssueComment | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_CrossReferencedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_AssignedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ClosedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_DemilestonedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LabeledEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_LockedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_MilestonedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_ReopenedEvent | moreIssueTimelineItems_repository_issue_timelineItems_edges_node_UnlabeledEvent;

export interface moreIssueTimelineItems_repository_issue_timelineItems_edges {
  __typename: "IssueTimelineItemsEdge";
  /**
   * The item at the end of the edge.
   */
  node: moreIssueTimelineItems_repository_issue_timelineItems_edges_node | null;
}

export interface moreIssueTimelineItems_repository_issue_timelineItems {
  __typename: "IssueTimelineItemsConnection";
  /**
   * Information to aid in pagination.
   */
  pageInfo: moreIssueTimelineItems_repository_issue_timelineItems_pageInfo;
  /**
   * A list of edges.
   */
  edges: (moreIssueTimelineItems_repository_issue_timelineItems_edges | null)[] | null;
}

export interface moreIssueTimelineItems_repository_issue {
  __typename: "Issue";
  /**
   * A list of events, comments, commits, etc. associated with the issue.
   */
  timelineItems: moreIssueTimelineItems_repository_issue_timelineItems;
}

export interface moreIssueTimelineItems_repository {
  __typename: "Repository";
  /**
   * Returns a single issue from the current repository by number.
   */
  issue: moreIssueTimelineItems_repository_issue | null;
}

export interface moreIssueTimelineItems {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: moreIssueTimelineItems_repository | null;
}

export interface moreIssueTimelineItemsVariables {
  owner: string;
  repoName: string;
  itemNumber: number;
  cursor?: string | null;
}
