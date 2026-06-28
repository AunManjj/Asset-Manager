import { and, desc, eq, sql } from "drizzle-orm";
import { db, metaTokensTable } from "../db";

export const GRAPH_VERSION = "v18.0";

export function formatAdAccountId(accountId: string): string {
  if (accountId.startsWith("act_")) return accountId;
  return `act_${accountId}`;
}

export async function getMetaTokenForClient(clientId: number) {
  const [token] = await db
    .select()
    .from(metaTokensTable)
    .where(and(eq(metaTokensTable.clientId, clientId), eq(metaTokensTable.isActive, "true")))
    .orderBy(desc(metaTokensTable.createdAt))
    .limit(1);

  if (!token || token.accessToken === "n8n-managed") return null;
  return token;
}

export async function graphGet<T>(path: string, accessToken: string): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes("?") ? "&" : "?"}access_token=${accessToken}`;
  const response = await fetch(url);
  return (await response.json()) as T;
}

export async function graphPost<T>(path: string, accessToken: string, body: Record<string, string>): Promise<T> {
  const params = new URLSearchParams({ ...body, access_token: accessToken });
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return (await response.json()) as T;
}

export function parseMetaInsights(insights?: { data?: Array<{ spend?: string; impressions?: string; clicks?: string; actions?: Array<{ action_type: string; value: string }> }> }) {
  const row = insights?.data?.[0];
  const spend = parseFloat(row?.spend ?? "0");
  const impressions = parseInt(row?.impressions ?? "0", 10);
  const clicks = parseInt(row?.clicks ?? "0", 10);
  const conversions =
    row?.actions?.find((a) => a.action_type === "purchase" || a.action_type === "lead")?.value ?? "0";
  return { spend, impressions, clicks, conversions: parseInt(conversions, 10) };
}

export async function exchangeLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
  const response = await fetch(url);
  return (await response.json()) as { access_token: string; expires_in?: number };
}
