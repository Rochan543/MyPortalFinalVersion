import { Router } from "express";
import { db, testAttemptsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { buildResult } from "./attempts";

const router = Router();

router.get("/:attemptId", authenticate, async (req, res) => {
  try {
    const attemptId = parseInt(String(req.params.attemptId), 10);
    const [attempt] = await db.select().from(testAttemptsTable)
      .where(and(eq(testAttemptsTable.id, attemptId), eq(testAttemptsTable.userId, req.user!.id))).limit(1);
    if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }
    const result = await buildResult(attemptId);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "GetResult error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
