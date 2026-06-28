import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const setterActivitiesTable = pgTable("setter_activities", {
  id: serial("id").primaryKey(),
  setterId: integer("setter_id").notNull(),
  date: text("date").notNull(),
  outreachCount: integer("outreach_count").notNull(),
  callsBooked: integer("calls_booked").notNull(),
  showRate: numeric("show_rate", { precision: 5, scale: 2 }).notNull(),
  responseRate: numeric("response_rate", { precision: 5, scale: 2 }),
  platform: text("platform"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSetterActivitySchema = createInsertSchema(setterActivitiesTable).omit({ id: true, createdAt: true });
export type InsertSetterActivity = z.infer<typeof insertSetterActivitySchema>;
export type SetterActivity = typeof setterActivitiesTable.$inferSelect;
