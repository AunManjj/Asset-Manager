import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, insightsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListInsightsResponse,
  GetInsightsSummaryResponse,
  ListInsightsQueryParams,
} from "@workspace/api-zod";

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

router.get("/insights", requireAuth, async (req, res): Promise<void> => {
  const qp = ListInsightsQueryParams.safeParse(req.query);
  let query = db.select().from(insightsTable);
  if (qp.success) {
    if (qp.data.campaignId) {
      query = query.where(eq(insightsTable.campaignId, qp.data.campaignId)) as typeof query;
    }
    if (qp.data.adId) {
      query = query.where(eq(insightsTable.adId, qp.data.adId)) as typeof query;
    }
  }
  const insights = await query.orderBy(insightsTable.date);
  res.json(ListInsightsResponse.parse(insights.map(serializeInsight)));
});

router.get("/insights/summary", requireAuth, async (_req, res): Promise<void> => {
  const [summary] = await db
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
