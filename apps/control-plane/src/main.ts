import { Router } from "express";
import jiraRoutes from "./api/jira";
import executionRoutes from "./api/execution";

const router = Router();

router.use("/jira", jiraRoutes);
router.use("/execution", executionRoutes);

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

export default router;
