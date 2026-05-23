import { Router } from "express";
import multer from "multer";
import { db, examsTable, questionsTable, examViolationsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ── Admin: List all topic mocks ──────────────────────────────────────────────
router.get("/admin/list", authenticate, requireAdmin, async (req, res) => {
  try {
    const mocks = await db.select().from(examsTable).where(eq(examsTable.isTopicMock, true)).orderBy(examsTable.createdAt);
    const result = await Promise.all(mocks.map(async (m) => {
      const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.examId, m.id));
      return { ...m, questionCount: Number(qCount) };
    }));
    res.json(result);
  } catch (err) {
    logger.error({ err }, "ListTopicMocks error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Create topic mock with file upload ────────────────────────────────
router.post("/admin/create", authenticate, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const { title, subjectName, topicName, duration, negativeMarks, examType } = req.body;
    if (!title || !subjectName || !topicName) {
      res.status(400).json({ error: "title, subjectName, topicName are required" });
      return;
    }

    const [exam] = await db.insert(examsTable).values({
      title,
      subjectName,
      topicName,
      duration: parseInt(duration || "15"),
      totalMarks: 20,
      negativeMarks: parseFloat(negativeMarks || "0.25"),
      examType: examType || "TOPIC_MOCK",
      isTopicMock: true,
      isPublished: false,
      createdBy: req.user!.id,
    }).returning();

    let questionsInserted = 0;
    if (req.file) {
      const questions = await extractQuestionsFromFile(req.file, exam.id);
      if (questions.length > 0) {
        await db.insert(questionsTable).values(questions);
        questionsInserted = questions.length;
        await db.update(examsTable).set({ totalMarks: questions.length }).where(eq(examsTable.id, exam.id));
      }
    }

    res.status(201).json({ ...exam, questionsInserted });
  } catch (err) {
    logger.error({ err }, "CreateTopicMock error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Upload questions to existing topic mock ───────────────────────────
router.post("/admin/:id/upload", authenticate, requireAdmin, upload.single("file"), async (req, res) => {
  try {
    const mockId = parseInt(String(req.params.id));
    const [mock] = await db.select().from(examsTable).where(and(eq(examsTable.id, mockId), eq(examsTable.isTopicMock, true))).limit(1);
    if (!mock) { res.status(404).json({ error: "Topic mock not found" }); return; }
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

    const questions = await extractQuestionsFromFile(req.file, mockId);
    if (questions.length > 0) {
      await db.insert(questionsTable).values(questions);
      const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.examId, mockId));
      await db.update(examsTable).set({ totalMarks: Number(qCount) }).where(eq(examsTable.id, mockId));
    }

    res.json({ questionsInserted: questions.length });
  } catch (err) {
    logger.error({ err }, "UploadTopicMockQuestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Edit topic mock ───────────────────────────────────────────────────
router.put("/admin/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const mockId = parseInt(String(req.params.id));
    const { title, subjectName, topicName, duration, negativeMarks } = req.body;
    const [updated] = await db.update(examsTable).set({
      ...(title && { title }),
      ...(subjectName && { subjectName }),
      ...(topicName && { topicName }),
      ...(duration && { duration: parseInt(duration) }),
      ...(negativeMarks !== undefined && { negativeMarks: parseFloat(String(negativeMarks)) }),
    }).where(and(eq(examsTable.id, mockId), eq(examsTable.isTopicMock, true))).returning();
    if (!updated) { res.status(404).json({ error: "Topic mock not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "EditTopicMock error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Delete topic mock ─────────────────────────────────────────────────
router.delete("/admin/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const mockId = parseInt(String(req.params.id));
    await db.delete(examsTable).where(and(eq(examsTable.id, mockId), eq(examsTable.isTopicMock, true)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "DeleteTopicMock error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: Publish / Unpublish ───────────────────────────────────────────────
router.post("/admin/:id/publish", authenticate, requireAdmin, async (req, res) => {
  try {
    const mockId = parseInt(String(req.params.id));
    const { publish } = req.body;
    const [updated] = await db.update(examsTable).set({ isPublished: !!publish })
      .where(and(eq(examsTable.id, mockId), eq(examsTable.isTopicMock, true))).returning();
    if (!updated) { res.status(404).json({ error: "Topic mock not found" }); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "PublishTopicMock error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Student: List published topic mocks ─────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const mocks = await db.select().from(examsTable)
      .where(and(eq(examsTable.isTopicMock, true), eq(examsTable.isPublished, true)))
      .orderBy(examsTable.subjectName, examsTable.topicName);

    const result = await Promise.all(mocks.map(async (m) => {
      const [{ qCount }] = await db.select({ qCount: count() }).from(questionsTable).where(eq(questionsTable.examId, m.id));
      return { ...m, questionCount: Number(qCount), description: m.description ?? undefined };
    }));

    const grouped: Record<string, { subject: string; topics: Record<string, typeof result> }> = {};
    for (const m of result) {
      const subject = m.subjectName || "General";
      const topic = m.topicName || "General";
      if (!grouped[subject]) grouped[subject] = { subject, topics: {} };
      if (!grouped[subject].topics[topic]) grouped[subject].topics[topic] = [];
      grouped[subject].topics[topic].push(m);
    }

    res.json({ mocks: result, grouped });
  } catch (err) {
    logger.error({ err }, "GetTopicMocks error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Student: Get single topic mock detail ────────────────────────────────────
router.get("/:id", authenticate, async (req, res) => {
  try {
    const mockId = parseInt(String(req.params.id));
    const [mock] = await db.select().from(examsTable)
      .where(and(eq(examsTable.id, mockId), eq(examsTable.isTopicMock, true))).limit(1);
    if (!mock) { res.status(404).json({ error: "Topic mock not found" }); return; }
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, mockId));
    res.json({ ...mock, questionCount: questions.length, description: mock.description ?? undefined });
  } catch (err) {
    logger.error({ err }, "GetTopicMock error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Exam Violations: Record a violation ─────────────────────────────────────
router.post("/violations/record", authenticate, async (req, res) => {
  try {
    const { examId, attemptId, violationType } = req.body;
    if (!examId) { res.status(400).json({ error: "examId required" }); return; }

    const userId = req.user!.id;
    const existing = await db.select().from(examViolationsTable)
      .where(and(eq(examViolationsTable.userId, userId), eq(examViolationsTable.examId, examId))).limit(1);

    if (existing.length === 0) {
      const [record] = await db.insert(examViolationsTable).values({
        userId, examId, attemptId: attemptId || null, violationCount: 1, autoSubmitted: false,
      }).returning();
      res.json({ violationCount: record.violationCount, autoSubmitted: false });
    } else {
      const newCount = existing[0].violationCount + 1;
      const autoSubmit = newCount >= 2;
      const [updated] = await db.update(examViolationsTable).set({
        violationCount: newCount,
        autoSubmitted: autoSubmit,
        updatedAt: new Date(),
      }).where(eq(examViolationsTable.id, existing[0].id)).returning();
      res.json({ violationCount: updated.violationCount, autoSubmitted: autoSubmit });
    }
  } catch (err) {
    logger.error({ err }, "RecordViolation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Exam Violations: Get status ──────────────────────────────────────────────
router.get("/violations/:examId", authenticate, async (req, res) => {
  try {
    const examId = parseInt(String(req.params.examId));
    const [record] = await db.select().from(examViolationsTable)
      .where(and(eq(examViolationsTable.userId, req.user!.id), eq(examViolationsTable.examId, examId))).limit(1);
    res.json(record || { violationCount: 0, autoSubmitted: false });
  } catch (err) {
    logger.error({ err }, "GetViolation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── File parsing helpers ─────────────────────────────────────────────────────
async function extractQuestionsFromFile(file: Express.Multer.File, examId: number) {
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  let text = "";

  try {
    if (ext === "pdf") {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default ?? (pdfParseModule as any);
      const parsed = await pdfParse(file.buffer);
      text = parsed.text;
    } else if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else {
      // TXT — preserve as-is
      text = file.buffer.toString("utf-8");
    }
  } catch (err) {
    logger.warn({ err }, "File parse failed");
    text = "";
  }

  return parseQuestionsFromText(text, examId);
}

/**
 * Robust question parser that handles:
 * - Multi-line questions
 * - Comprehension passages (paragraph before questions)
 * - Long explanations
 * - Various question number formats: 1., Q1., Q.1, 1), (1)
 * - Various option formats: A., (A), A), A:
 */
function parseQuestionsFromText(rawText: string, examId: number) {
  type QuestionRow = {
    examId: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string | null;
    marks: number;
    negativeMarks: number;
    questionType: string;
  };

  const questions: QuestionRow[] = [];

  // Normalize line endings
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split text into blocks by question number patterns.
  // We support: "1.", "Q1.", "Q 1.", "Q.1", "1)", "(1)"
  // We use a regex that captures the number and splits on it.
  // The lookahead ensures we don't consume too eagerly.
  const QUESTION_START = /^(?:Q\.?\s*)?(\d{1,3})[\.\)\:][ \t]+/m;

  // Split on lines that start with question numbers
  const lines = text.split("\n");
  
  // Group lines into question blocks
  const blocks: { paragraph: string; lines: string[] }[] = [];
  let currentBlock: string[] = [];
  let currentParagraph = "";
  let inQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (QUESTION_START.test(trimmed)) {
      if (inQuestion && currentBlock.length > 0) {
        blocks.push({ paragraph: currentParagraph, lines: [...currentBlock] });
        currentBlock = [];
      } else if (!inQuestion) {
        // Everything before the first question is a paragraph/passage
        currentParagraph = currentBlock.join("\n").trim();
        currentBlock = [];
      }
      inQuestion = true;
      currentBlock.push(trimmed);
    } else if (inQuestion) {
      currentBlock.push(trimmed);
    } else {
      // Pre-question paragraph
      currentBlock.push(trimmed);
    }
  }

  // Don't forget the last block
  if (inQuestion && currentBlock.length > 0) {
    blocks.push({ paragraph: currentParagraph, lines: [...currentBlock] });
  }

  for (const block of blocks) {
    if (questions.length >= 100) break;

    const parsed = parseQuestionBlock(block.lines, block.paragraph, examId);
    if (parsed) questions.push(parsed);
  }

  return questions;
}

function parseQuestionBlock(lines: string[], paragraph: string, examId: number) {
  if (lines.length === 0) return null;

  // Option patterns (A., (A), A), A:)
  const OPTION_RE = /^[\(\[]?([A-Da-d])[\)\]\.:][ \t]+(.+)/;
  // Answer pattern
  const ANSWER_RE = /^(?:Ans(?:wer)?|Correct(?:\s+Answer)?|Key)[:\s]+\(?([A-Da-d])\)?/i;
  // Explanation pattern
  const EXPL_RE = /^(?:Exp(?:lanation)?|Solution|Reason|Hint)[:\s]+(.*)/i;

  // First line contains the question number + start of question text
  // Strip the question number prefix
  const firstLine = lines[0].replace(/^(?:Q\.?\s*)?(\d{1,3})[\.\)\:][ \t]+/, "").trim();

  let questionLines: string[] = [firstLine];
  let optionA = "", optionB = "", optionC = "", optionD = "";
  let correctAnswer = "A";
  let explanationLines: string[] = [];
  let currentSection: "question" | "option" | "answer" | "explanation" = "question";
  let currentOptionKey = "";

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Blank line — if we're in question section, it's a paragraph break, keep it
      if (currentSection === "question") questionLines.push("");
      continue;
    }

    const optionMatch = line.match(OPTION_RE);
    const answerMatch = line.match(ANSWER_RE);
    const explMatch = line.match(EXPL_RE);

    if (answerMatch) {
      currentSection = "answer";
      correctAnswer = answerMatch[1].toUpperCase();
    } else if (explMatch) {
      currentSection = "explanation";
      explanationLines.push(explMatch[1]);
    } else if (optionMatch) {
      currentSection = "option";
      currentOptionKey = optionMatch[1].toUpperCase();
      const optionText = optionMatch[2].trim();
      if (currentOptionKey === "A") optionA = optionText;
      else if (currentOptionKey === "B") optionB = optionText;
      else if (currentOptionKey === "C") optionC = optionText;
      else if (currentOptionKey === "D") optionD = optionText;
    } else if (currentSection === "option") {
      // Continuation of an option (multi-line option text)
      const appendText = " " + line;
      if (currentOptionKey === "A") optionA += appendText;
      else if (currentOptionKey === "B") optionB += appendText;
      else if (currentOptionKey === "C") optionC += appendText;
      else if (currentOptionKey === "D") optionD += appendText;
    } else if (currentSection === "explanation") {
      explanationLines.push(line);
    } else if (currentSection === "question") {
      // Continuation of question text (multi-line)
      questionLines.push(line);
    }
  }

  // Build final question text — include paragraph if exists
  let questionText = questionLines.join("\n").trim();
  if (paragraph) {
    questionText = paragraph + "\n\n" + questionText;
  }

  // Trim options
  optionA = optionA.trim();
  optionB = optionB.trim();
  optionC = optionC.trim();
  optionD = optionD.trim();

  // Must have at least question text and 2 options to be valid
  if (!questionText || !optionA || !optionB) return null;

  // Fill missing options gracefully
  if (!optionC) optionC = "-";
  if (!optionD) optionD = "-";

  const explanation = explanationLines.length > 0 ? explanationLines.join("\n").trim() : null;

  return {
    examId,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    explanation,
    marks: 1,
    negativeMarks: 0.25,
    questionType: "MCQ" as const,
  };
}

export default router;
