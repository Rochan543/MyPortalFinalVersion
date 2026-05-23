import { Router } from "express";
import { db, examsTable, sectionsTable, questionsTable } from "@workspace/db";
import { eq, and, ilike, sql, count } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { examType, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // const conditions = [eq(examsTable.isPublished, true)];
    const conditions = [];
    if (examType) conditions.push(eq(examsTable.examType, examType));
    if (search) conditions.push(ilike(examsTable.title, `%${search}%`));

    const exams = await db.select().from(examsTable).where(and(...conditions)).limit(limitNum).offset(offset).orderBy(examsTable.createdAt);
    const [{ total }] = await db.select({ total: count() }).from(examsTable).where(and(...conditions));

    const examsWithCounts = await Promise.all(exams.map(async (exam) => {
      const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.examId, exam.id));
      return { ...exam, questionCount: qCount, attemptCount: 0, description: exam.description ?? undefined };
    }));

    res.json({ exams: examsWithCounts, total: Number(total), page: pageNum, totalPages: Math.ceil(Number(total) / limitNum) });
  } catch (err) {
    logger.error({ err }, "GetExams error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const {
  title,
  description,
  examType,
  duration,
  totalMarks,
  negativeMarks,

  isTopicMock,
  subjectName,
  topicName,

} = req.body;
const [exam] = await db
  .insert(examsTable)
  .values({

    title,

    description,

    examType,

    duration,

    totalMarks,

    negativeMarks:
      negativeMarks ?? 0,

    createdBy:
      req.user!.id,

    isTopicMock:
      isTopicMock ?? false,

    subjectName:
      subjectName ?? null,

    topicName:
      topicName ?? null,

  })
  .returning();
    res.status(201).json({ ...exam, questionCount: 0, attemptCount: 0, description: exam.description ?? undefined });
  } catch (err) {
    logger.error({ err }, "CreateExam error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:examId", authenticate, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId), 10);
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, examId)).limit(1);
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }

    const sections = await db.select().from(sectionsTable).where(eq(sectionsTable.examId, examId));
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, examId));

    const sectionsWithQuestions = sections.map(section => ({
      ...section,
      questionCount: questions.filter(q => q.sectionId === section.id).length,
      questions: questions.filter(q => q.sectionId === section.id).map(q => ({
        ...q, explanation: q.explanation ?? undefined, sectionId: q.sectionId ?? undefined,
      })),
    }));

    res.json({
      ...exam,
      description: exam.description ?? undefined,
      questionCount: questions.length,
      attemptCount: 0,
      sections: sectionsWithQuestions,
    });
  } catch (err) {
    logger.error({ err }, "GetExam error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:examId", authenticate, requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId), 10);
    const { title, description, examType, duration, totalMarks, negativeMarks } = req.body;
    const [exam] = await db.update(examsTable).set({ title, description, examType, duration, totalMarks, negativeMarks }).where(eq(examsTable.id, examId)).returning();
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }
    const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.examId, examId));
    res.json({ ...exam, questionCount: qCount, attemptCount: 0, description: exam.description ?? undefined });
  } catch (err) {
    logger.error({ err }, "UpdateExam error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:examId", authenticate, requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId), 10);
    await db.delete(examsTable).where(eq(examsTable.id, examId));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "DeleteExam error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:examId/publish", authenticate, requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId), 10);
    const [existing] = await db.select().from(examsTable).where(eq(examsTable.id, examId)).limit(1);
    if (!existing) { res.status(404).json({ error: "Exam not found" }); return; }
    const [exam] = await db.update(examsTable).set({ isPublished: !existing.isPublished }).where(eq(examsTable.id, examId)).returning();
    const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.examId, examId));
    res.json({ ...exam, questionCount: qCount, attemptCount: 0, description: exam.description ?? undefined });
  } catch (err) {
    logger.error({ err }, "PublishExam error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:examId/sections", authenticate, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId), 10);
    const sections = await db.select().from(sectionsTable).where(eq(sectionsTable.examId, examId));
    const sectionsWithCounts = await Promise.all(sections.map(async (s) => {
      const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.sectionId, s.id));
      return { ...s, questionCount: qCount };
    }));
    res.json(sectionsWithCounts);
  } catch (err) {
    logger.error({ err }, "GetExamSections error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:examId/sections", authenticate, requireAdmin, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId), 10);
    const { sectionName, sectionDuration } = req.body;
    const [section] = await db.insert(sectionsTable).values({ examId, sectionName, sectionDuration: sectionDuration ?? 0 }).returning();
    res.status(201).json({ ...section, questionCount: 0 });
  } catch (err) {
    logger.error({ err }, "CreateSection error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
