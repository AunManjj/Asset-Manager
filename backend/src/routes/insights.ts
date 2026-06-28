import { Router, type IRouter } from "express";
import { eq, sql, and, inArray } from "drizzle-orm";
import { db, insightsTable, campaignsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import { canViewAgencyData, isAdmin, isClient, requireAuthUser } from "../middlewares/rbac";
import {
  ListInsightsResponse,
  GetInsightsSummaryResponse,
  ListInsightsQueryParams,
} from "../validation";

const router: IRouter = Router();

function serializeInsight(i: typeof insightsTable.$inferSelect) {
  return {
    id: i.id,
    campaignId: i.campaignId,
    adId: i.adId,
    date: i.date,
    spend: Number(i.spend),
    impressions: i.impressions,
    clicks: i.clicks,
    conversions: i.conversions,
    ctr: i.ctr != null ? Number(i.ctr) : null,
    cpc: i.cpc != null ? Number(i.cpc) : null,
    cpm: i.cpm != null ? Number(i.cpm) : null,
    roas: i.roas != null ? Number(i.roas) : null,
    reach: i.reach,
    frequency: i.frequency != null ? Number(i.frequency) : null,
    createdAt: i.createdAt.toISOString(),
  };
}

async function getScopedCampaignIds(user: Awaited<ReturnType<typeof requireAuthUser>> & object): Promise<number[] | "all"> {
  if (isAdmin(user)) return "all";
  if (isClient(user) && user.clientId) {
    const rows = await db
      .select({ id: campaignsTable.id })
      .from(campaignsTable)
      .where(eq(campaignsTable.clientId, user.clientId));
    return rows.map((r) => r.id);
  }
  return [];
}

router.get("/insights", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const scopedIds = await getScopedCampaignIds(user);
  if (Array.isArray(scopedIds) && scopedIds.length === 0) {
    res.json(ListInsightsResponse.parse([]));
    return;
  }

  const qp = ListInsightsQueryParams.safeParse(req.query);
  const conditions = [];

  if (scopedIds !== "all") {
    conditions.push(inArray(insightsTable.campaignId, scopedIds));
  }
  if (qp.success && qp.data.campaignId) {
    if (scopedIds !== "all" && !scopedIds.includes(qp.data.campaignId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    conditions.push(eq(insightsTable.campaignId, qp.data.campaignId));
  }
  if (qp.success && qp.data.adId) {
    conditions.push(eq(insightsTable.adId, qp.data.adId));
  }

  let query = db.select().from(insightsTable);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  const insights = await query.orderBy(insightsTable.date);
  res.json(ListInsightsResponse.parse(insights.map(serializeInsight)));
});

router.get("/insights/summary", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const scopedIds = await getScopedCampaignIds(user);
  if (Array.isArray(scopedIds) && scopedIds.length === 0) {
    res.json(GetInsightsSummaryResponse.parse({
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCtr: 0,
      avgRoas: 0,
      avgCpc: 0,
    }));
    return;
  }

  const whereClause = scopedIds !== "all" ? inArray(insightsTable.campaignId, scopedIds) : undefined;

  const baseQuery = db
    .select({
      totalSpend: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
      totalImpressions: sql<number>`coalesce(sum(${insightsTable.impressions}), 0)`,
      totalClicks: sql<number>`coalesce(sum(${insightsTable.clicks}), 0)`,
      totalConversions: sql<number>`coalesce(sum(${insightsTable.conversions}), 0)`,
      avgCtr: sql<number>`coalesce(avg(${insightsTable.ctr}), 0)`,
      avgRoas: sql<number>`coalesce(avg(${insightsTable.roas}), 0)`,
      avgCpc: sql<number>`coalesce(avg(${insightsTable.cpc}), 0)`,
    })
    .from(insightsTable);

  const [summary] = whereClause ? await baseQuery.where(whereClause) : await baseQuery;

  res.json(GetInsightsSummaryResponse.parse({
    totalSpend: Number(summary.totalSpend),
    totalImpressions: Number(summary.totalImpressions),
    totalClicks: Number(summary.totalClicks),
    totalConversions: Number(summary.totalConversions),
    avgCtr: Number(summary.avgCtr),
    avgRoas: Number(summary.avgRoas),
    avgCpc: Number(summary.avgCpc),
  }));
});

export default router;
