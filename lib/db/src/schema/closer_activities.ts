import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const closerActivitiesTable = pgTable("closer_activities", {
  id: serial("id").primaryKey(),
  closerId: integer("closer_id").notNull(),
  clientId: integer("client_id"),
  date: text("date").notNull(),
  callsTaken: integer("calls_taken").notNull(),
  dealsWon: integer("deals_won").notNull(),
  revenue: numeric("revenue", { precision: 12, scale: 2 }).notNull(),
  closeRate: numeric("close_rate", { precision: 5, scale: 2 }).notNull(),
  avgDealSize: numeric("avg_deal_size", { precision: 12, scale: 2 }),
  objections: text("objections"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCloserActivitySchema = createInsertSchema(closerActivitiesTable).omit({ id: true, createdAt: true });
export type InsertCloserActivity = z.infer<typeof insertCloserActivitySchema>;
export type CloserActivity = typeof closerActivitiesTable.$inferSelect;
