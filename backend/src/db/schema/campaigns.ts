import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientId: integer("client_id").notNull(),
  metaCampaignId: text("meta_campaign_id"),
  status: text("status").notNull().default("draft"),
  objective: text("objective").notNull(),
  dailyBudget: numeric("daily_budget", { precision: 12, scale: 2 }),
  totalBudget: numeric("total_budget", { precision: 12, scale: 2 }),
  startDate: text("start_date"),
  endDate: text("end_date"),
  spend: numeric("spend", { precision: 12, scale: 2 }),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  conversions: integer("conversions"),
  roas: numeric("roas", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;
