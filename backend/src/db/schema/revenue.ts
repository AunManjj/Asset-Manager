import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const revenueTable = pgTable("revenue", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  closerId: integer("closer_id"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull().default("new_deal"),
  date: text("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRevenueSchema = createInsertSchema(revenueTable).omit({ id: true, createdAt: true });
export type InsertRevenue = z.infer<typeof insertRevenueSchema>;
export type Revenue = typeof revenueTable.$inferSelect;
