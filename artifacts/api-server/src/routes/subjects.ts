import { Router } from "express";
import { db, subjectsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const subjects = await db.select().from(subjectsTable);

    res.json(subjects);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch subjects",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, examType } = req.body;

    const [subject] = await db
      .insert(subjectsTable)
      .values({
        name,
        examType,
      })
      .returning();

    res.json(subject);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to create subject",
    });
  }
});

export default router;