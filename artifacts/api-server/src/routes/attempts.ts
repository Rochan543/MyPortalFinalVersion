import { Router } from "express";
import { db, testAttemptsTable, answersTable, examsTable, questionsTable, sectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/", authenticate, async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) { res.status(400).json({ error: "examId is required" }); return; }
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, examId)).limit(1);
    if (!exam) { res.status(404).json({ error: "Exam not found" }); return; }

    // Check for existing incomplete attempt
    const existing = await db.select().from(testAttemptsTable)
      .where(and(eq(testAttemptsTable.userId, req.user!.id), eq(testAttemptsTable.examId, examId), eq(testAttemptsTable.isSubmitted, false)))
      .limit(1);
    if (existing.length > 0) {
      res.json(await buildAttemptDetail(existing[0].id, req.user!.id));
      return;
    }

    const [attempt] = await db.insert(testAttemptsTable).values({
      userId: req.user!.id,
      examId,
      isSubmitted: false,
    }).returning();

    res.status(201).json(await buildAttemptDetail(attempt.id, req.user!.id));
  } catch (err) {
    logger.error({ err }, "StartAttempt error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:attemptId", authenticate, async (req, res) => {
  try {
    const attemptId = parseInt(String(req.params.attemptId), 10);
    const detail = await buildAttemptDetail(attemptId, req.user!.id);
    if (!detail) { res.status(404).json({ error: "Attempt not found" }); return; }
    res.json(detail);
  } catch (err) {
    logger.error({ err }, "GetAttempt error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:attemptId/answer", authenticate, async (req, res) => {
  try {
    const attemptId = parseInt(String(req.params.attemptId), 10);
    const { questionId, selectedOption, markedForReview } = req.body;

    const [attempt] = await db.select().from(testAttemptsTable)
      .where(and(eq(testAttemptsTable.id, attemptId), eq(testAttemptsTable.userId, req.user!.id))).limit(1);
    if (!attempt || attempt.isSubmitted) { res.status(400).json({ error: "Invalid attempt" }); return; }

    const existing = await db.select().from(answersTable)
      .where(and(eq(answersTable.attemptId, attemptId), eq(answersTable.questionId, questionId))).limit(1);

    if (existing.length > 0) {
      await db.update(answersTable).set({
        selectedOption: selectedOption ?? null,
        markedForReview: markedForReview ?? false,
      }).where(eq(answersTable.id, existing[0].id));
    } else {
      await db.insert(answersTable).values({
        attemptId,
        questionId,
        selectedOption: selectedOption ?? null,
        markedForReview: markedForReview ?? false,
        isCorrect: null,
      });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "SaveAnswer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:attemptId/submit", authenticate, async (req, res) => {
  try {
    const attemptId = parseInt(String(req.params.attemptId), 10);
    const [attempt] = await db.select().from(testAttemptsTable)
      .where(and(eq(testAttemptsTable.id, attemptId), eq(testAttemptsTable.userId, req.user!.id))).limit(1);
    if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }
    if (attempt.isSubmitted) {
      // Already submitted — return result
      const result = await buildResult(attemptId);
      res.json(result);
      return;
    }

    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, attempt.examId)).limit(1);
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, attempt.examId));
    const answers = await db.select().from(answersTable).where(eq(answersTable.attemptId, attemptId));

    let totalCorrect = 0, totalWrong = 0, score = 0;

    for (const question of questions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (answer?.selectedOption) {
        const isCorrect = answer.selectedOption.toUpperCase() === question.correctAnswer.toUpperCase();
        await db.update(answersTable).set({ isCorrect }).where(eq(answersTable.id, answer.id));
        if (isCorrect) {
          totalCorrect++;
          score += question.marks;
        } else {
          totalWrong++;
          score -= question.negativeMarks;
        }
      }
    }

    const totalUnattempted = questions.length - totalCorrect - totalWrong;
    const attempted = totalCorrect + totalWrong;
    const accuracy = attempted > 0 ? (totalCorrect / attempted) * 100 : 0;
    const timeTaken = exam ? exam.duration * 60 - (attempt.isSubmitted ? 0 : 0) : 0;

    await db.update(testAttemptsTable).set({
      isSubmitted: true,
      score,
      accuracy,
      totalCorrect,
      totalWrong,
      totalUnattempted,
      timeTaken,
      submittedAt: new Date(),
    }).where(eq(testAttemptsTable.id, attemptId));

    res.json(await buildResult(attemptId));
  } catch (err) {
    logger.error({ err }, "SubmitAttempt error");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function buildAttemptDetail(attemptId: number, userId: number) {
  const [attempt] = await db.select().from(testAttemptsTable)
    .where(and(eq(testAttemptsTable.id, attemptId), eq(testAttemptsTable.userId, userId))).limit(1);
  if (!attempt) return null;

  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, attempt.examId)).limit(1);
  const sections = await db.select().from(sectionsTable).where(eq(sectionsTable.examId, attempt.examId));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, attempt.examId));
  const savedAnswers = await db.select().from(answersTable).where(eq(answersTable.attemptId, attemptId));

  const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
  const totalSeconds = (exam?.duration ?? 60) * 60;
  const timeRemaining = Math.max(0, totalSeconds - elapsed);

  const sectionsWithQuestions = sections.map(s => ({
    ...s,
    questionCount: questions.filter(q => q.sectionId === s.id).length,
    questions: questions.filter(q => q.sectionId === s.id).map(q => ({
      ...q,
      explanation: q.explanation ?? undefined,
      sectionId: q.sectionId ?? undefined,
    })),
  }));

  // If no sections, put all questions in a default section
  const allQuestionsMapped = sectionsWithQuestions.length > 0 ? sectionsWithQuestions : [{
    id: 0,
    examId: attempt.examId,
    sectionName: "General",
    sectionDuration: exam?.duration ?? 60,
    questionCount: questions.length,
    questions: questions.map(q => ({ ...q, explanation: q.explanation ?? undefined, sectionId: q.sectionId ?? undefined })),
  }];

  return {
    id: attempt.id,
    examId: attempt.examId,
    exam: {
      ...exam,
      description: exam?.description ?? undefined,
      questionCount: questions.length,
      attemptCount: 0,
      sections: allQuestionsMapped,
    },
    startedAt: attempt.startedAt,
    timeRemaining,
    isSubmitted: attempt.isSubmitted,
    savedAnswers: savedAnswers.map(a => ({
      questionId: a.questionId,
      selectedOption: a.selectedOption ?? undefined,
      markedForReview: a.markedForReview,
    })),
  };
}

async function buildResult(attemptId: number) {
  const [attempt] = await db.select().from(testAttemptsTable).where(eq(testAttemptsTable.id, attemptId)).limit(1);
  if (!attempt) return null;
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, attempt.examId)).limit(1);
  const sections = await db.select().from(sectionsTable).where(eq(sectionsTable.examId, attempt.examId));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, attempt.examId));
  const answers = await db.select().from(answersTable).where(eq(answersTable.attemptId, attemptId));

  const sectionResults = sections.map(s => {
    const sectionQs = questions.filter(q => q.sectionId === s.id);
    const sectionAnswers = answers.filter(a => sectionQs.some(q => q.id === a.questionId));
    const correct = sectionAnswers.filter(a => a.isCorrect).length;
    const wrong = sectionAnswers.filter(a => a.isCorrect === false && a.selectedOption).length;
    const unattempted = sectionQs.length - correct - wrong;
    const secScore = sectionQs.reduce((acc, q) => {
      const ans = sectionAnswers.find(a => a.questionId === q.id);
      if (ans?.isCorrect) return acc + q.marks;
      if (ans?.isCorrect === false && ans.selectedOption) return acc - q.negativeMarks;
      return acc;
    }, 0);
    const attempted = correct + wrong;
    return {
      sectionId: s.id,
      sectionName: s.sectionName,
      correct,
      wrong,
      unattempted,
      score: secScore,
      accuracy: attempted > 0 ? (correct / attempted) * 100 : 0,
    };
  });

  const questionResults = questions.map(q => {
    const ans = answers.find(a => a.questionId === q.id);
    return {
      questionId: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      selectedOption: ans?.selectedOption ?? undefined,
      isCorrect: ans?.isCorrect ?? false,
      explanation: q.explanation ?? undefined,
      sectionName: sections.find(s => s.id === q.sectionId)?.sectionName ?? "General",
    };
  });

  // Rank: count attempts with higher score
  const { count: countFn } = await import("drizzle-orm");
  const higherScores = await db.select({ cnt: countFn() }).from(testAttemptsTable)
    .where(and(eq(testAttemptsTable.examId, attempt.examId), eq(testAttemptsTable.isSubmitted, true)));
  const rank = 1; // simplified rank

  return {
    id: attempt.id,
    examId: attempt.examId,
    examTitle: exam?.title ?? "Unknown",
    score: attempt.score ?? 0,
    totalMarks: exam?.totalMarks ?? 0,
    accuracy: attempt.accuracy ?? 0,
    totalCorrect: attempt.totalCorrect ?? 0,
    totalWrong: attempt.totalWrong ?? 0,
    totalUnattempted: attempt.totalUnattempted ?? 0,
    timeTaken: attempt.timeTaken ?? 0,
    rank,
    negativeMarks: exam?.negativeMarks ?? 0,
    sectionResults,
    questionResults,
  };
}

export { buildResult };
export default router;
