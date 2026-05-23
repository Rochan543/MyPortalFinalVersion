import { pgTable, serial, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { examsTable } from "./exams";

export const sectionsTable = pgTable("sections", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => examsTable.id, { onDelete: "cascade" }),
  sectionName: varchar("section_name", { length: 100 }).notNull(),
  sectionDuration: integer("section_duration").notNull().default(0),
});

export const insertSectionSchema = createInsertSchema(sectionsTable).omit({ id: true });
export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sectionsTable.$inferSelect;
