import { pgTable, serial, integer, text, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { examsTable } from "./exams";
import { sectionsTable } from "./sections";
import { subjectsTable } from "./subjects";
import { topicsTable } from "./topics";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => examsTable.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").references(() => sectionsTable.id, { onDelete: "set null" }),
  subjectId: integer("subject_id")
    .references(() => subjectsTable.id, {
      onDelete: "set null",
    }),

  topicId: integer("topic_id")
    .references(() => topicsTable.id, {
      onDelete: "set null",
    }),

  difficulty: varchar("difficulty", {
    length: 20,
  }).default("EASY"),

  year: integer("year"),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: varchar("correct_answer", { length: 5 }).notNull(),
  explanation: text("explanation"),
  marks: integer("marks").notNull().default(1),
  negativeMarks: real("negative_marks").notNull().default(0),
  questionType: varchar("question_type", { length: 30 }).notNull().default("MCQ"),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
