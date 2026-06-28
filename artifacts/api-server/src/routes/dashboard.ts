import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, clientsTable, campaignsTable, revenueTable, notificationsTable, insightsTable, setterActivitiesTable, closerActivitiesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  GetDashboardSummaryResponse,
  GetActivityFeedResponse,
  GetPerformanceMetricsResponse,
  GetPerformanceMetricsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res): Promise<void> => {
  const [clientStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${clientsTable.status} = 'active')`,
    })
    .from(clientsTable);

  const [campaignStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${campaignsTable.status} = 'active')`,
    })
    .from(campaignsTable);

  const [revenueStats] = await db
    .select({
      total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const [monthlyRevenue] = await db
    .select({
      amount: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable)
    .where(sql`${revenueTable.date} >= ${monthStart}`);

  const [spendStats] = await db
    .select({
      total: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
      avgRoas: sql<number>`coalesce(avg(${insightsTable.roas}), 0)`,
    })
    .from(insightsTable);

  const [notifCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(eq(notificationsTable.isRead, false));

  const topCampaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.roas)).limit(1);

  res.json(GetDashboardSummaryResponse.parse({
    totalClients: Number(clientStats.total),
    activeClients: Number(clientStats.active),
    totalCampaigns: Number(campaignStats.total),
    activeCampaigns: Number(campaignStats.active),
    totalRevenue: Number(revenueStats.total),
    monthlyRevenue: Number(monthlyRevenue.amount),
    totalSpend: Number(spendStats.total),
    avgRoas: Number(spendStats.avgRoas),
    openNotifications: Number(notifCount.count),
    topPerformingCampaign: topCampaigns[0] ? {
      id: topCampaigns[0].id,
      name: topCampaigns[0].name,
      clientId: topCampaigns[0].clientId,
      clientName: null,
      metaCampaignId: topCampaigns[0].metaCampaignId,
      status: topCampaigns[0].status,
      objective: topCampaigns[0].objective,
      dailyBudget: topCampaigns[0].dailyBudget ? Number(topCampaigns[0].dailyBudget) : null,
      totalBudget: topCampaigns[0].totalBudget ? Number(topCampaigns[0].totalBudget) : null,
      startDate: topCampaigns[0].startDate,
      endDate: topCampaigns[0].endDate,
      spend: topCampaigns[0].spend ? Number(topCampaigns[0].spend) : null,
      impressions: topCampaigns[0].impressions,
      clicks: topCampaigns[0].clicks,
      conversions: topCampaigns[0].conversions,
      roas: topCampaigns[0].roas ? Number(topCampaigns[0].roas) : null,
      createdAt: topCampaigns[0].createdAt.toISOString(),
    } : undefined,
  }));
});

router.get("/dashboard/activity-feed", requireAuth, async (_req, res): Promise<void> => {
  const recentRevenue = await db.select().from(revenueTable).orderBy(desc(revenueTable.createdAt)).limit(5);
  const recentCampaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt)).limit(3);
  const recentClients = await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt)).limit(3);

  const feed = [
    ...recentRevenue.map((r, i) => ({
      id: i + 1,
      type: "revenue",
      description: `New revenue of $${Number(r.amount).toLocaleString()} recorded (${r.type})`,
      entityType: "revenue",
      entityId: r.id,
      userName: null,
      createdAt: r.createdAt.toISOString(),
    })),
    ...recentCampaigns.map((c, i) => ({
      id: recentRevenue.length + i + 1,
      type: "campaign",
      description: `Campaign "${c.name}" is ${c.status}`,
      entityType: "campaign",
      entityId: c.id,
      userName: null,
      createdAt: c.createdAt.toISOString(),
    })),
    ...recentClients.map((c, i) => ({
      id: recentRevenue.length + recentCampaigns.length + i + 1,
      type: "client",
      description: `Client "${c.name}" added`,
      entityType: "client",
      entityId: c.id,
      userName: null,
      createdAt: c.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  res.json(GetActivityFeedResponse.parse(feed));
});

router.get("/dashboard/performance", requireAuth, async (req, res): Promise<void> => {
  const qp = GetPerformanceMetricsQueryParams.safeParse(req.query);
  const days = qp.success && qp.data.period === "7d" ? 7 : qp.success && qp.data.period === "90d" ? 90 : 30;
  const period = qp.success ? (qp.data.period ?? "30d") : "30d";

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  const dateFromStr = dateFrom.toISOString().slice(0, 10);

  const spendByDay = await db
    .select({
      date: insightsTable.date,
      value: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
    })
    .from(insightsTable)
    .where(sql`${insightsTable.date} >= ${dateFromStr}`)
    .groupBy(insightsTable.date)
    .orderBy(insightsTable.date);

  const revenueByDay = await db
    .select({
      date: revenueTable.date,
      value: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable)
    .where(sql`${revenueTable.date} >= ${dateFromStr}`)
    .groupBy(revenueTable.date)
    .orderBy(revenueTable.date);

  const callsBookedByDay = await db
    .select({
      date: setterActivitiesTable.date,
      value: sql<number>`coalesce(sum(${setterActivitiesTable.callsBooked}), 0)`,
    })
    .from(setterActivitiesTable)
    .where(sql`${setterActivitiesTable.date} >= ${dateFromStr}`)
    .groupBy(setterActivitiesTable.date)
    .orderBy(setterActivitiesTable.date);

  const dealsWonByDay = await db
    .select({
      date: closerActivitiesTable.date,
      value: sql<number>`coalesce(sum(${closerActivitiesTable.dealsWon}), 0)`,
    })
    .from(closerActivitiesTable)
    .where(sql`${closerActivitiesTable.date} >= ${dateFromStr}`)
    .groupBy(closerActivitiesTable.date)
    .orderBy(closerActivitiesTable.date);

  res.json(GetPerformanceMetricsResponse.parse({
    period,
    spendByDay: spendByDay.map(r => ({ date: r.date, value: Number(r.value) })),
    revenueByDay: revenueByDay.map(r => ({ date: r.date, value: Number(r.value) })),
    callsBookedByDay: callsBookedByDay.map(r => ({ date: r.date, value: Number(r.value) })),
    dealsWonByDay: dealsWonByDay.map(r => ({ date: r.date, value: Number(r.value) })),
  }));
});

export default router;
