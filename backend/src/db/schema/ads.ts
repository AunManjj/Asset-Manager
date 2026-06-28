import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  adsetId: integer("adset_id").notNull(),
  metaAdId: text("meta_ad_id"),
  status: text("status").notNull().default("draft"),
  headline: text("headline"),
  body: text("body"),
  imageUrl: text("image_url"),
  destinationUrl: text("destination_url"),
  spend: numeric("spend", { precision: 12, scale: 2 }),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  ctr: numeric("ctr", { precision: 8, scale: 4 }),
  cpc: numeric("cpc", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdSchema = createInsertSchema(adsTable).omit({ id: true, createdAt: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof adsTable.$inferSelect;
