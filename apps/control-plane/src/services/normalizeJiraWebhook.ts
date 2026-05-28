import { JiraWebhookPayload } from "../types/jiraWebhook";
import { NormalizedTaskEvent } from "../types/task";

export function normalizeJiraWebhook(
  payload: JiraWebhookPayload,
): NormalizedTaskEvent {
  const assignee = payload.issue.fields.assignee;

  const changedFields =
    payload.changelog?.items.map((item) => item.field) || [];

  let eventType: NormalizedTaskEvent["eventType"] = "TASK_UPDATED";

  const assigneeChanged = changedFields.includes("assignee");
  const isCreation = payload.webhookEvent === "jira:issue_created" || payload.issue_event_type_name === "issue_created";

  if (assigneeChanged || (isCreation && assignee)) {
    if (assignee) {
      const aiAgentId = process.env.JIRA_AI_AGENT_ACCOUNT_ID;
      if (aiAgentId && assignee.accountId === aiAgentId) {
        eventType = "TASK_ASSIGNED_TO_AGENT";
      } else {
        eventType = "TASK_ASSIGNED_TO_HUMAN";
      }
    } else {
      eventType = "TASK_UNASSIGNED";
    }
  } else {
    eventType = "TASK_UPDATED";
  }

  return {
    eventType,

    source: "jira",

    sourceEvent: payload.issue_event_type_name,

    receivedAt: new Date().toISOString(),

    issue: {
      id: payload.issue.id,

      key: payload.issue.key,

      title: payload.issue.fields.summary,

      description: payload.issue.fields.description,

      priority: payload.issue.fields.priority?.name,

      project: {
        id: payload.issue.fields.project.id,

        key: payload.issue.fields.project.key,

        name: payload.issue.fields.project.name,
      },

      status: {
        id: payload.issue.fields.status.id,

        name: payload.issue.fields.status.name,
      },
    },

    agent: assignee
      ? {
          accountId: assignee.accountId,

          displayName: assignee.displayName,
        }
      : undefined,

    changedFields,
  };
}
