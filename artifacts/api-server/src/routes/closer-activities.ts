import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, closerActivitiesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListCloserActivitiesResponse,
  CreateCloserActivityBody,
  CreateCloserActivityResponse,
  GetCloserStatsResponse,
  UpdateCloserActivityBody,
  UpdateCloserActivityParams,
  DeleteCloserActivityParams,
  DeleteCloserActivityResponse,
  ListCloserActivitiesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function serializeActivity(a: typeof closerActivitiesTable.$inferSelect) {
  let closerName: string | null = null;
  const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.closerId));
  closerName = u?.name ?? null;
  return {
    id: a.id,
    closerId: a.closerId,
    closerName,
    clientId: a.clientId,
    date: a.date,
    callsTaken: a.callsTaken,
    dealsWon: a.dealsWon,
    revenue: Number(a.revenue),
    closeRate: Number(a.closeRate),
    avgDealSize: a.avgDealSize != null ? Number(a.avgDealSize) : null,
    objections: a.objections,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/closer-activities", requireAuth, async (req, res): Promise<void> => {
  const qp = ListCloserActivitiesQueryParams.safeParse(req.query);
  let query = db.select().from(closerActivitiesTable);
  if (qp.success && qp.data.closerId) {
    query = query.where(eq(closerActivitiesTable.closerId, qp.data.closerId)) as typeof query;
  }
  const activities = await query.orderBy(closerActivitiesTable.date);
  const serialized = await Promise.all(activities.map(serializeActivity));
  res.json(ListCloserActivitiesResponse.parse(serialized));
});

router.post("/closer-activities", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCloserActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db.insert(closerActivitiesTable).values(parsed.data).returning();
  res.status(201).json(CreateCloserActivityResponse.parse(await serializeActivity(activity)));
});

router.get("/closer-activities/stats", requireAuth, async (_req, res): Promise<void> => {
  const closers = await db.select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.role, "closer"));

  const stats = await Promise.all(closers.map(async (closer) => {
    const [agg] = await db
      .select({
        totalCalls: sql<number>`coalesce(sum(${closerActivitiesTable.callsTaken}), 0)`,
        totalDealsWon: sql<number>`coalesce(sum(${closerActivitiesTable.dealsWon}), 0)`,
        totalRevenue: sql<number>`coalesce(sum(${closerActivitiesTable.revenue}), 0)`,
        avgCloseRate: sql<number>`coalesce(avg(${closerActivitiesTable.closeRate}), 0)`,
        avgDealSize: sql<number>`coalesce(avg(${closerActivitiesTable.avgDealSize}), 0)`,
      })
      .from(closerActivitiesTable)
      .where(eq(closerActivitiesTable.closerId, closer.id));

    return {
      closerId: closer.id,
      closerName: closer.name,
      totalCalls: Number(agg.totalCalls),
      totalDealsWon: Number(agg.totalDealsWon),
      totalRevenue: Number(agg.totalRevenue),
      avgCloseRate: Number(agg.avgCloseRate),
      avgDealSize: Number(agg.avgDealSize),
      period: "all_time",
    };
  }));

  res.json(GetCloserStatsResponse.parse(stats));
});

router.patch("/closer-activities/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCloserActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCloserActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db.update(closerActivitiesTable).set(parsed.data).where(eq(closerActivitiesTable.id, params.data.id)).returning();
  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }
  res.json(await serializeActivity(activity));
});

router.delete("/closer-activities/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCloserActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [activity] = await db.delete(closerActivitiesTable).where(eq(closerActivitiesTable.id, params.data.id)).returning();
  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }
  res.json(DeleteCloserActivityResponse.parse({ message: "Activity deleted" }));
});

export default router;
