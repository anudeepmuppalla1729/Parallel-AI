import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mainRouter from "./src/main";

import { logger } from "./src/utils/logger";

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. GLOBAL MIDDLEWARE
// ==========================================
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Enable Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
});
app.use(limiter);

// ==========================================
// 2. ROUTE INTEGRATOR
// ==========================================
// Mount the master router from src/main.ts
app.use("/", mainRouter);

// ==========================================
// 3. START SERVER
// ==========================================
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
