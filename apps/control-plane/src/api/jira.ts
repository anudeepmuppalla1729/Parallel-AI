import { Router } from "express";

import { normalizeJiraWebhook } from "../services/normalizeJiraWebhook";
import { JiraWebhookPayload } from "../types/jiraWebhook";
import { taskQueue } from "../queues/taskQueue";
import { redisClient } from "../config/redis";
import { prisma } from "../config/db";
import { logger } from "../utils/logger";

const router = Router();

router.get("/webhook", (req, res) => {
  res.status(200).send("Webhook OK");
});

router.post("/webhook", async (req, res) => {
  try {
    // cast incoming body
    const payload = req.body as JiraWebhookPayload;

    // normalize webhook
    const normalizedEvent = normalizeJiraWebhook(payload);

    // inspect normalized result
    logger.debug({ event: normalizedEvent }, "Normalized Jira webhook event received");

    // Handle Task Ownership & Queuing
    const issueKey = normalizedEvent.issue.key;

    if (normalizedEvent.eventType === "TASK_ASSIGNED_TO_AGENT") {
      // 1. Set execution lease to RUNNING in Redis (Fast Polling)
      await redisClient.set(`execution-lease:${issueKey}`, "RUNNING");
      
      // 1.b. Set execution lease to RUNNING in Postgres (Source of Truth)
      await prisma.taskExecution.upsert({
        where: { issueKey },
        update: {
          assignedTo: process.env.JIRA_AI_AGENT_ACCOUNT_ID || "AI_AGENT",
          status: "RUNNING",
          cancelledAt: null,
        },
        create: {
          issueKey,
          assignedTo: process.env.JIRA_AI_AGENT_ACCOUNT_ID || "AI_AGENT",
          status: "RUNNING",
        }
      });

      // 2. Enqueue to taskQueue
      await taskQueue.add("planner-job", normalizedEvent, {
        jobId: `planner-${issueKey}-${Date.now()}`,
      });
      logger.info({ issueKey }, "Enqueued task for issue and set lease to RUNNING");
    } else if (
      normalizedEvent.eventType === "TASK_UNASSIGNED" ||
      normalizedEvent.eventType === "TASK_ASSIGNED_TO_HUMAN"
    ) {
      // 1. Cancel execution lease in Redis
      await redisClient.set(`execution-lease:${issueKey}`, "CANCELLED");

      // 1.b. Cancel execution lease in Postgres
      await prisma.taskExecution.upsert({
        where: { issueKey },
        update: {
          assignedTo: normalizedEvent.eventType === "TASK_ASSIGNED_TO_HUMAN" ? "HUMAN" : "UNASSIGNED",
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
        create: {
          issueKey,
          assignedTo: normalizedEvent.eventType === "TASK_ASSIGNED_TO_HUMAN" ? "HUMAN" : "UNASSIGNED",
          status: "CANCELLED",
          cancelledAt: new Date(),
        }
      });
      logger.info({ issueKey, eventType: normalizedEvent.eventType }, "Execution lease marked as CANCELLED in DB and Cache");
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    logger.error({ err: error }, "Webhook processing failed");

    return res.status(500).json({
      error: "Webhook processing failed",
    });
  }
});

export default router;
