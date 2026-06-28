import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, revenueTable, clientsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  ListRevenueResponse,
  CreateRevenueBody,
  CreateRevenueResponse,
  GetRevenueSummaryResponse,
  UpdateRevenueBody,
  UpdateRevenueParams,
  DeleteRevenueParams,
  DeleteRevenueResponse,
  ListRevenueQueryParams,
} from "../validation";

const router: IRouter = Router();

async function serializeRevenue(r: typeof revenueTable.$inferSelect) {
  let clientName: string | null = null;
  const [c] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, r.clientId));
  clientName = c?.name ?? null;
  return {
    id: r.id,
    clientId: r.clientId,
    clientName,
    closerId: r.closerId,
    amount: Number(r.amount),
    type: r.type,
    date: r.date,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/revenue", requireAuth, async (req, res): Promise<void> => {
  const qp = ListRevenueQueryParams.safeParse(req.query);
  let query = db.select().from(revenueTable);
  if (qp.success && qp.data.clientId) {
    query = query.where(eq(revenueTable.clientId, qp.data.clientId)) as typeof query;
  }
  const records = await query.orderBy(desc(revenueTable.date));
  const serialized = await Promise.all(records.map(serializeRevenue));
  res.json(ListRevenueResponse.parse(serialized));
});

router.post("/revenue", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateRevenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [record] = await db.insert(revenueTable).values(parsed.data).returning();
  res.status(201).json(CreateRevenueResponse.parse(await serializeRevenue(record)));
});

router.get("/revenue/summary", requireAuth, async (_req, res): Promise<void> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);

  const [totals] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable);

  const [monthly] = await db
    .select({
      monthlyRevenue: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable)
    .where(sql`${revenueTable.date} >= ${monthStart}`);

  const [lastMonthly] = await db
    .select({
      lastRevenue: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable)
    .where(sql`${revenueTable.date} >= ${lastMonthStart} AND ${revenueTable.date} < ${monthStart}`);

  const byType = await db
    .select({
      type: revenueTable.type,
      amount: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(revenueTable)
    .groupBy(revenueTable.type);

  const byMonth = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${revenueTable.date}::date), 'YYYY-MM')`,
      amount: sql<number>`coalesce(sum(${revenueTable.amount}), 0)`,
    })
    .from(revenueTable)
    .groupBy(sql`date_trunc('month', ${revenueTable.date}::date)`)
    .orderBy(sql`date_trunc('month', ${revenueTable.date}::date)`);

  const monthlyRev = Number(monthly.monthlyRevenue);
  const lastMonthRev = Number(lastMonthly.lastRevenue);
  const growth = lastMonthRev > 0 ? ((monthlyRev - lastMonthRev) / lastMonthRev) * 100 : 0;

  res.json(GetRevenueSummaryResponse.parse({
    totalRevenue: Number(totals.totalRevenue),
    monthlyRevenue: monthlyRev,
    revenueGrowth: growth,
    revenueByType: byType.map(r => ({ type: r.type, amount: Number(r.amount), count: Number(r.count) })),
    revenueByMonth: byMonth.map(r => ({ month: r.month, amount: Number(r.amount) })),
  }));
});

router.patch("/revenue/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateRevenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRevenueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [record] = await db.update(revenueTable).set(parsed.data).where(eq(revenueTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Revenue record not found" });
    return;
  }
  res.json(await serializeRevenue(record));
});

router.delete("/revenue/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteRevenueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [record] = await db.delete(revenueTable).where(eq(revenueTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Revenue record not found" });
    return;
  }
  res.json(DeleteRevenueResponse.parse({ message: "Revenue record deleted" }));
});

export default router;
