export interface JiraWebhookPayload {
  webhookEvent: string;

  issue_event_type_name: string;

  issue: {
    id: string;
    key: string;

    fields: {
      summary: string;

      description?: string | null;

      priority?: {
        id: string;
        name: string;
      };

      project: {
        id: string;
        key: string;
        name: string;
      };

      assignee?: {
        accountId: string;
        displayName: string;
      } | null;

      creator: {
        accountId: string;
        displayName: string;
      };

      status: {
        id: string;
        name: string;
      };

      created: string;
      updated: string;
    };
  };

  changelog?: {
    id: string;

    items: Array<{
      field: string;
      fieldId: string;

      fromString: string | null;
      toString: string | null;
    }>;
  };
}
