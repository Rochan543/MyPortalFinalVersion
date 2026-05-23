import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  examType: varchar("exam_type", { length: 50 }).notNull(),
});