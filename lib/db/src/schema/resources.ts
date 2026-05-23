import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  subjectName: varchar("subject_name", { length: 100 }),
  topicName: varchar("topic_name", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileName: text("file_name"),
  fileType: varchar("file_type", { length: 20 }),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  tags: text("tags"),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const previousYearPapersTable = pgTable("previous_year_papers", {
  id: serial("id").primaryKey(),
  examName: varchar("exam_name", { length: 100 }),
  examYear: integer("exam_year"),
  shiftName: varchar("shift_name", { length: 50 }),
  subjectName: varchar("subject_name", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileName: text("file_name"),
  fileType: varchar("file_type", { length: 20 }),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Resource = typeof resourcesTable.$inferSelect;
export type PreviousYearPaper = typeof previousYearPapersTable.$inferSelect;
