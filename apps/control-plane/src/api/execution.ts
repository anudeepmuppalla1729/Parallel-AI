import { Router } from "express";
import { redisClient } from "../config/redis";

import { logger } from "../utils/logger";

const router = Router();

router.get("/lease/:issueKey", async (req, res) => {
  try {
    const { issueKey } = req.params;

    const leaseStatus = await redisClient.get(`execution-lease:${issueKey}`);

    if (!leaseStatus) {
      return res.status(404).json({
        success: false,
        error: "Lease not found",
      });
    }

    return res.status(200).json({
      success: true,
      issueKey,
      status: leaseStatus,
    });
  } catch (error) {
    logger.error({ err: error, issueKey: req.params.issueKey }, "Error fetching execution lease");
    return res.status(500).json({
      success: false,
      error: "Failed to fetch lease status",
    });
  }
});

export default router;
