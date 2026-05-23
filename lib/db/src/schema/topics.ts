import { pgTable, serial, integer, varchar } from "drizzle-orm/pg-core";
import { subjectsTable } from "./subjects";

export const topicsTable = pgTable("topics", {
  id: serial("id").primaryKey(),

  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjectsTable.id, {
      onDelete: "cascade",
    }),

  topicName: varchar("topic_name", { length: 100 }).notNull(),
});