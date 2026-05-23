import { Router } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { examId, sectionId, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (examId) conditions.push(eq(questionsTable.examId, parseInt(examId, 10)));
    if (sectionId) conditions.push(eq(questionsTable.sectionId, parseInt(sectionId, 10)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const questions = await db.select().from(questionsTable).where(whereClause).limit(limitNum).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(questionsTable).where(whereClause);

    res.json({
      questions: questions.map(q => ({ ...q, explanation: q.explanation ?? undefined, sectionId: q.sectionId ?? undefined })),
      total: Number(total),
      page: pageNum,
      totalPages: Math.ceil(Number(total) / limitNum),
    });
  } catch (err) {
    logger.error({ err }, "GetQuestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { examId, sectionId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, marks, negativeMarks, questionType } = req.body;
    const [question] = await db.insert(questionsTable).values({
      examId, sectionId: sectionId ?? null, questionText, optionA, optionB, optionC, optionD,
      correctAnswer, explanation: explanation ?? null, marks: marks ?? 1,
      negativeMarks: negativeMarks ?? 0, questionType: questionType ?? "MCQ",
    }).returning();
    res.status(201).json({ ...question, explanation: question.explanation ?? undefined, sectionId: question.sectionId ?? undefined });
  } catch (err) {
    logger.error({ err }, "CreateQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:questionId", authenticate, requireAdmin, async (req, res) => {
  try {
    const questionId = parseInt(String(req.params.questionId), 10);
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, marks, negativeMarks } = req.body;
    const [question] = await db.update(questionsTable).set({
      questionText, optionA, optionB, optionC, optionD, correctAnswer,
      explanation: explanation ?? null, marks, negativeMarks,
    }).where(eq(questionsTable.id, questionId)).returning();
    if (!question) { res.status(404).json({ error: "Question not found" }); return; }
    res.json({ ...question, explanation: question.explanation ?? undefined, sectionId: question.sectionId ?? undefined });
  } catch (err) {
    logger.error({ err }, "UpdateQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:questionId", authenticate, requireAdmin, async (req, res) => {
  try {
    const questionId = parseInt(String(req.params.questionId), 10);
    await db.delete(questionsTable).where(eq(questionsTable.id, questionId));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "DeleteQuestion error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
