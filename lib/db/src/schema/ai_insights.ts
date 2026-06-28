import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiInsightsTable = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"),
  campaignId: integer("campaign_id"),
  type: text("type").notNull(),
  content: text("content").notNull(),
  prompt: text("prompt"),
  model: text("model").notNull().default("gpt-4o"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiInsightSchema = createInsertSchema(aiInsightsTable).omit({ id: true, createdAt: true });
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiInsight = typeof aiInsightsTable.$inferSelect;
