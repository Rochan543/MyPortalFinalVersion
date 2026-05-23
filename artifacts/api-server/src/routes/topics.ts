import { Router } from "express";
import { db, topicsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const topics = await db.select().from(topicsTable);

    res.json(topics);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch topics",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { subjectId, topicName } = req.body;

    const [topic] = await db
      .insert(topicsTable)
      .values({
        subjectId,
        topicName,
      })
      .returning();

    res.json(topic);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to create topic",
    });
  }
});

export default router;