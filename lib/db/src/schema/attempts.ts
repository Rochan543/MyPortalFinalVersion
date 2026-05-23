import { pgTable, serial, integer, real, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { examsTable } from "./exams";
import { questionsTable } from "./questions";

export const testAttemptsTable = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  examId: integer("exam_id").notNull().references(() => examsTable.id, { onDelete: "cascade" }),
  score: real("score"),
  accuracy: real("accuracy"),
  totalCorrect: integer("total_correct"),
  totalWrong: integer("total_wrong"),
  totalUnattempted: integer("total_unattempted"),
  timeTaken: integer("time_taken"),
  isSubmitted: boolean("is_submitted").notNull().default(false),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
});

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => testAttemptsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  selectedOption: varchar("selected_option", { length: 5 }),
  markedForReview: boolean("marked_for_review").notNull().default(false),
  isCorrect: boolean("is_correct"),
});

export const bookmarksTable = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const examViolationsTable = pgTable("exam_violations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  examId: integer("exam_id").notNull(),
  attemptId: integer("attempt_id"),
  violationCount: integer("violation_count").notNull().default(0),
  autoSubmitted: boolean("auto_submitted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAttemptSchema = createInsertSchema(testAttemptsTable).omit({ id: true, startedAt: true });
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type TestAttempt = typeof testAttemptsTable.$inferSelect;
export type Answer = typeof answersTable.$inferSelect;
export type Bookmark = typeof bookmarksTable.$inferSelect;
export type ExamViolation = typeof examViolationsTable.$inferSelect;
