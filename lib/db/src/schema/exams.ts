import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  real,
  timestamp
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";

import { z } from "zod/v4";

import { usersTable } from "./users";

export const examsTable = pgTable("exams", {

  id: serial("id").primaryKey(),

  title: varchar("title", {
    length: 255
  }).notNull(),

  description: text("description"),

  examType: varchar("exam_type", {
    length: 50
  }).notNull(),

  duration: integer("duration")
    .notNull(),

  totalMarks: integer("total_marks")
    .notNull(),

  negativeMarks: real(
    "negative_marks"
  )
    .notNull()
    .default(0),

  isPublished: boolean(
    "is_published"
  )
    .notNull()
    .default(false),

  createdBy: integer(
    "created_by"
  ).references(
    () => usersTable.id
  ),

  isTopicMock: boolean(
    "is_topic_mock"
  ).default(false),

  subjectName: varchar(
    "subject_name",
    {
      length: 100
    }
  ),

  topicName: varchar(
    "topic_name",
    {
      length: 100
    }
  ),

  createdAt: timestamp(
    "created_at"
  )
    .notNull()
    .defaultNow(),
});

export const insertExamSchema =
  createInsertSchema(
    examsTable
  ).omit({
    id: true,
    createdAt: true,
    isPublished: true
  });

export type InsertExam =
  z.infer<
    typeof insertExamSchema
  >;

export type Exam =
  typeof examsTable.$inferSelect;