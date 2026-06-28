import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metaTokensTable = pgTable("meta_tokens", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  adAccountId: text("ad_account_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: text("token_expires_at"),
  scopes: text("scopes").notNull().default("ads_read,ads_management"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMetaTokenSchema = createInsertSchema(metaTokensTable).omit({ id: true, createdAt: true });
export type InsertMetaToken = z.infer<typeof insertMetaTokenSchema>;
export type MetaToken = typeof metaTokensTable.$inferSelect;
