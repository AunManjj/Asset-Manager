import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insightsTable = pgTable("insights", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  adId: integer("ad_id"),
  date: text("date").notNull(),
  spend: numeric("spend", { precision: 12, scale: 2 }).notNull(),
  impressions: integer("impressions").notNull(),
  clicks: integer("clicks").notNull(),
  conversions: integer("conversions"),
  ctr: numeric("ctr", { precision: 8, scale: 4 }),
  cpc: numeric("cpc", { precision: 8, scale: 4 }),
  cpm: numeric("cpm", { precision: 8, scale: 4 }),
  roas: numeric("roas", { precision: 8, scale: 4 }),
  reach: integer("reach"),
  frequency: numeric("frequency", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInsightSchema = createInsertSchema(insightsTable).omit({ id: true, createdAt: true });
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type Insight = typeof insightsTable.$inferSelect;
