import express from "express";
import dotenv from "dotenv";
import jiraRoutes from "./api/jira";
import executionRoutes from "./api/execution";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/jira", jiraRoutes);
app.use("/execution", executionRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
