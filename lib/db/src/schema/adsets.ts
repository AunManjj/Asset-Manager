import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adsetsTable = pgTable("adsets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  campaignId: integer("campaign_id").notNull(),
  metaAdsetId: text("meta_adset_id"),
  status: text("status").notNull().default("draft"),
  dailyBudget: numeric("daily_budget", { precision: 12, scale: 2 }),
  targeting: text("targeting"),
  optimizationGoal: text("optimization_goal"),
  spend: numeric("spend", { precision: 12, scale: 2 }),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdsetSchema = createInsertSchema(adsetsTable).omit({ id: true, createdAt: true });
export type InsertAdset = z.infer<typeof insertAdsetSchema>;
export type Adset = typeof adsetsTable.$inferSelect;
