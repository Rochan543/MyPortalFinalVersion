import { Router } from "express";
import { db, testAttemptsTable, answersTable, questionsTable, examsTable, bookmarksTable, sectionsTable } from "@workspace/db";
import { eq, and, avg, max, sum, desc, count } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { buildResult } from "./attempts";

const router = Router();

router.get("/attempts", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const attempts = await db.select().from(testAttemptsTable)
      .where(and(eq(testAttemptsTable.userId, userId), eq(testAttemptsTable.isSubmitted, true)))
      .orderBy(desc(testAttemptsTable.submittedAt));

    const result = await Promise.all(attempts.map(async (a) => {
      const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, a.examId)).limit(1);
      return {
        id: a.id,
        examId: a.examId,
        examTitle: exam?.title ?? "Unknown",
        examType: exam?.examType ?? "Unknown",
        score: a.score ?? 0,
        accuracy: a.accuracy ?? 0,
        totalCorrect: a.totalCorrect ?? 0,
        totalWrong: a.totalWrong ?? 0,
        timeTaken: a.timeTaken ?? 0,
        submittedAt: a.submittedAt ?? a.startedAt,
        rank: 1,
      };
    }));

    res.json(result);
  } catch (err) {
    logger.error({ err }, "GetMyAttempts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const attempts = await db.select().from(testAttemptsTable)
      .where(and(eq(testAttemptsTable.userId, userId), eq(testAttemptsTable.isSubmitted, true)))
      .orderBy(desc(testAttemptsTable.submittedAt));

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0 ? attempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts : 0;
    const averageAccuracy = totalAttempts > 0 ? attempts.reduce((s, a) => s + (a.accuracy ?? 0), 0) / totalAttempts : 0;
    const bestScore = totalAttempts > 0 ? Math.max(...attempts.map(a => a.score ?? 0)) : 0;
    const totalTimeSpent = attempts.reduce((s, a) => s + (a.timeTaken ?? 0), 0);

    // Subject performance per exam type
    const subjectMap = new Map<string, { correct: number; total: number }>();
    for (const attempt of attempts.slice(0, 20)) {
      const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, attempt.examId)).limit(1);
      const subject = exam?.examType ?? "General";
      const answers = await db.select().from(answersTable).where(eq(answersTable.attemptId, attempt.id));
      const correct = answers.filter(a => a.isCorrect).length;
      const prev = subjectMap.get(subject) ?? { correct: 0, total: 0 };
      subjectMap.set(subject, { correct: prev.correct + correct, total: prev.total + answers.length });
    }

    const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, d]) => ({
      subject,
      accuracy: d.total > 0 ? (d.correct / d.total) * 100 : 0,
      totalQuestions: d.total,
      correctQuestions: d.correct,
    }));

    const weakAreas = subjectPerformance.filter(s => s.accuracy < 50).map(s => s.subject);
    const strongAreas = subjectPerformance.filter(s => s.accuracy >= 70).map(s => s.subject);

    const recentAttempts = await Promise.all(attempts.slice(0, 5).map(async a => {
      const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, a.examId)).limit(1);
      return {
        id: a.id,
        examId: a.examId,
        examTitle: exam?.title ?? "Unknown",
        examType: exam?.examType ?? "Unknown",
        score: a.score ?? 0,
        accuracy: a.accuracy ?? 0,
        totalCorrect: a.totalCorrect ?? 0,
        totalWrong: a.totalWrong ?? 0,
        timeTaken: a.timeTaken ?? 0,
        submittedAt: a.submittedAt ?? a.startedAt,
        rank: 1,
      };
    }));

    const scoreHistory = attempts.slice(0, 15).reverse().map(a => ({
      date: (a.submittedAt ?? a.startedAt).toISOString().split("T")[0],
      score: a.score ?? 0,
      examTitle: "",
    }));

    res.json({
      totalAttempts,
      averageScore,
      averageAccuracy,
      bestScore,
      totalTimeSpent,
      subjectPerformance,
      recentAttempts,
      weakAreas,
      strongAreas,
      scoreHistory,
    });
  } catch (err) {
    logger.error({ err }, "GetMyAnalytics error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookmarks", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const bookmarks = await db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, userId));
    const questions = await Promise.all(bookmarks.map(async b => {
      const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, b.questionId)).limit(1);
      if (!q) return null;
      return { ...q, explanation: q.explanation ?? undefined, sectionId: q.sectionId ?? undefined };
    }));
    res.json(questions.filter(Boolean));
  } catch (err) {
    logger.error({ err }, "GetBookmarks error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookmarks", authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { questionId } = req.body;
    const existing = await db.select().from(bookmarksTable)
      .where(and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.questionId, questionId))).limit(1);
    if (existing.length > 0) {
      await db.delete(bookmarksTable).where(eq(bookmarksTable.id, existing[0].id));
      res.json({ bookmarked: false });
    } else {
      await db.insert(bookmarksTable).values({ userId, questionId });
      res.json({ bookmarked: true });
    }
  } catch (err) {
    logger.error({ err }, "ToggleBookmark error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
