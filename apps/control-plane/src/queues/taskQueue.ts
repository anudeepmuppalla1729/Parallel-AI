import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";

export const taskQueue = new Queue("task-queue", {
  connection: redisConfig,
});