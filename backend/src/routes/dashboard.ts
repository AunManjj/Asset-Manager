import { eq, sql, desc, and, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, clientsTable, campaignsTable, revenueTable, notificationsTable, insightsTable, setterActivitiesTable, closerActivitiesTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import { canViewAgencyData, isClient, requireAuthUser } from "../middlewares/rbac";
import {
  GetDashboardSummaryResponse,
  GetActivityFeedResponse,
  GetPerformanceMetricsResponse,
  GetPerformanceMetricsQueryParams,
} from "../validation";

const router: IRouter = Router();

async function getClientCampaignIds(clientId: number): Promise<number[]> {
  const rows = await db
    .select({ id: campaignsTable.id })
    .from(campaignsTable)
    .where(eq(campaignsTable.clientId, clientId));
  return rows.map((r) => r.id);
}

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user) return;
  if (!canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const scopedClientId = isClient(user) && user.clientId ? user.clientId : null;
  const clientFilter = scopedClientId ? eq(campaignsTable.clientId, scopedClientId) : undefined;
  const revenueFilter = scopedClientId ? eq(revenueTable.clientId, scopedClientId) : undefined;

  const [clientStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${clientsTable.status} = 'active')`,
    })
    .from(clientsTable)
    .where(scopedClientId ? eq(clientsTable.id, scopedClientId) : undefined);

  const campaignQuery = db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${campaignsTable.status} = 'active')`,
    })
    .from(campaignsTable);
  const [campaignStats] = clientFilter
    ? await campaignQuery.where(clientFilter)
    : await campaignQuery;

  const revenueQuery = db
    .select({ total: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` })
    .from(revenueTable);
  const [revenueStats] = revenueFilter
    ? await revenueQuery.where(revenueFilter)
    : await revenueQuery;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthlyConditions = scopedClientId
    ? and(sql`${revenueTable.date} >= ${monthStart}`, eq(revenueTable.clientId, scopedClientId))
    : sql`${revenueTable.date} >= ${monthStart}`;
  const [monthlyRevenue] = await db
    .select({ amount: sql<number>`coalesce(sum(${revenueTable.amount}), 0)` })
    .from(revenueTable)
    .where(monthlyConditions);

  let spendStats: { total: number; avgRoas: number };
  if (scopedClientId) {
    const campaignIds = await getClientCampaignIds(scopedClientId);
    if (campaignIds.length === 0) {
      spendStats = { total: 0, avgRoas: 0 };
    } else {
      const [row] = await db
        .select({
          total: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
          avgRoas: sql<number>`coalesce(avg(${insightsTable.roas}), 0)`,
        })
        .from(insightsTable)
        .where(inArray(insightsTable.campaignId, campaignIds));
      spendStats = { total: Number(row?.total ?? 0), avgRoas: Number(row?.avgRoas ?? 0) };
    }
  } else {
    const [row] = await db
      .select({
        total: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
        avgRoas: sql<number>`coalesce(avg(${insightsTable.roas}), 0)`,
      })
      .from(insightsTable);
    spendStats = { total: Number(row?.total ?? 0), avgRoas: Number(row?.avgRoas ?? 0) };
  }

  const [notifCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(eq(notificationsTable.isRead, false));

  const topCampaignsQuery = db.select().from(campaignsTable).orderBy(desc(campaignsTable.roas)).limit(1);
  const topCampaigns = clientFilter
    ? await topCampaignsQuery.where(clientFilter)
    : await topCampaignsQuery;

  res.json(GetDashboardSummaryResponse.parse({
    totalClients: Number(clientStats.total),
    activeClients: Number(clientStats.active),
    totalCampaigns: Number(campaignStats.total),
    activeCampaigns: Number(campaignStats.active),
    totalRevenue: Number(revenueStats.total),
    monthlyRevenue: Number(monthlyRevenue.amount),
    totalSpend: spendStats.total,
    avgRoas: spendStats.avgRoas,
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

router.get("/dashboard/activity-feed", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const scopedClientId = isClient(user) && user.clientId ? user.clientId : null;

  const recentRevenue = scopedClientId
    ? await db.select().from(revenueTable).where(eq(revenueTable.clientId, scopedClientId)).orderBy(desc(revenueTable.createdAt)).limit(5)
    : await db.select().from(revenueTable).orderBy(desc(revenueTable.createdAt)).limit(5);

  const recentCampaigns = scopedClientId
    ? await db.select().from(campaignsTable).where(eq(campaignsTable.clientId, scopedClientId)).orderBy(desc(campaignsTable.createdAt)).limit(3)
    : await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt)).limit(3);

  const recentClients = scopedClientId
    ? await db.select().from(clientsTable).where(eq(clientsTable.id, scopedClientId)).orderBy(desc(clientsTable.createdAt)).limit(3)
    : await db.select().from(clientsTable).orderBy(desc(clientsTable.createdAt)).limit(3);

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
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const scopedClientId = isClient(user) && user.clientId ? user.clientId : null;
  const qp = GetPerformanceMetricsQueryParams.safeParse(req.query);
  const days = qp.success && qp.data.period === "7d" ? 7 : qp.success && qp.data.period === "90d" ? 90 : 30;
  const period = qp.success ? (qp.data.period ?? "30d") : "30d";

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  const dateFromStr = dateFrom.toISOString().slice(0, 10);

  let spendByDay: { date: string; value: number }[] = [];
  if (scopedClientId) {
    const campaignIds = await getClientCampaignIds(scopedClientId);
    if (campaignIds.length > 0) {
      const rows = await db
        .select({
          date: insightsTable.date,
          value: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
        })
        .from(insightsTable)
        .where(and(sql`${insightsTable.date} >= ${dateFromStr}`, inArray(insightsTable.campaignId, campaignIds)))
        .groupBy(insightsTable.date)
        .orderBy(insightsTable.date);
      spendByDay = rows.map((r) => ({ date: r.date, value: Number(r.value) }));
    }
  } else {
    const rows = await db
      .select({
        date: insightsTable.date,
        value: sql<number>`coalesce(sum(${insightsTable.spend}), 0)`,
      })
      .from(insightsTable)
      .where(sql`${insightsTable.date} >= ${dateFromStr}`)
      .groupBy(insightsTable.date)
      .orderBy(insightsTable.date);
    spendByDay = rows.map((r) => ({ date: r.date, value: Number(r.value) }));
  }

  const revenueByDayConditions = scopedClientId
    ? and(sql`${revenueTable.date} >= ${dateFromStr}`, eq(revenueTable.clientId, scopedClientId))
    : sql`${revenueTable.date} >= ${dateFromStr}`;
  const revenueRows = await db
    .select({
      date: revenueTable.date,
      value: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable)
    .where(revenueByDayConditions)
    .groupBy(revenueTable.date)
    .orderBy(revenueTable.date);

  // Setter/closer metrics are internal — clients only see ad + revenue performance
  let callsBookedByDay: { date: string; value: number }[] = [];
  let dealsWonByDay: { date: string; value: number }[] = [];

  if (!scopedClientId) {
    const callsRows = await db
      .select({
        date: setterActivitiesTable.date,
        value: sql<number>`coalesce(sum(${setterActivitiesTable.callsBooked}), 0)`,
      })
      .from(setterActivitiesTable)
      .where(sql`${setterActivitiesTable.date} >= ${dateFromStr}`)
      .groupBy(setterActivitiesTable.date)
      .orderBy(setterActivitiesTable.date);
    callsBookedByDay = callsRows.map((r) => ({ date: r.date, value: Number(r.value) }));

    const dealsRows = await db
      .select({
        date: closerActivitiesTable.date,
        value: sql<number>`coalesce(sum(${closerActivitiesTable.dealsWon}), 0)`,
      })
      .from(closerActivitiesTable)
      .where(sql`${closerActivitiesTable.date} >= ${dateFromStr}`)
      .groupBy(closerActivitiesTable.date)
      .orderBy(closerActivitiesTable.date);
    dealsWonByDay = dealsRows.map((r) => ({ date: r.date, value: Number(r.value) }));
  }

  res.json(GetPerformanceMetricsResponse.parse({
    period,
    spendByDay,
    revenueByDay: revenueRows.map((r) => ({ date: r.date, value: Number(r.value) })),
    callsBookedByDay,
    dealsWonByDay,
  }));
});

export default router;
