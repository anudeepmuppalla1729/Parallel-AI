export type NormalizedEventType =
  | "TASK_ASSIGNED_TO_AGENT"
  | "TASK_ASSIGNED_TO_HUMAN"
  | "TASK_UPDATED"
  | "TASK_UNASSIGNED";

export interface NormalizedTaskEvent {
  eventType: NormalizedEventType;

  source: "jira";

  sourceEvent: string;

  receivedAt: string;

  issue: {
    id: string;
    key: string;

    title: string;

    description?: string | null;

    priority?: string;

    project: {
      id: string;
      key: string;
      name: string;
    };

    status: {
      id: string;
      name: string;
    };
  };

  agent?: {
    accountId: string;
    displayName: string;
  };

  changedFields: string[];
}
