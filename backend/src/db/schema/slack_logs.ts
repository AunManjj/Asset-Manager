import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const slackLogsTable = pgTable("slack_logs", {
  id: serial("id").primaryKey(),
  channel: text("channel").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("sent"),
  triggeredBy: text("triggered_by"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSlackLogSchema = createInsertSchema(slackLogsTable).omit({ id: true, createdAt: true });
export type InsertSlackLog = z.infer<typeof insertSlackLogSchema>;
export type SlackLog = typeof slackLogsTable.$inferSelect;
