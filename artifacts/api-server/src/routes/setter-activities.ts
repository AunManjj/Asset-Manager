import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, setterActivitiesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListSetterActivitiesResponse,
  CreateSetterActivityBody,
  CreateSetterActivityResponse,
  GetSetterStatsResponse,
  UpdateSetterActivityBody,
  UpdateSetterActivityParams,
  DeleteSetterActivityParams,
  DeleteSetterActivityResponse,
  ListSetterActivitiesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function serializeActivity(a: typeof setterActivitiesTable.$inferSelect) {
  let setterName: string | null = null;
  const [u] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, a.setterId));
  setterName = u?.name ?? null;
  return {
    id: a.id,
    setterId: a.setterId,
    setterName,
    date: a.date,
    outreachCount: a.outreachCount,
    callsBooked: a.callsBooked,
    showRate: Number(a.showRate),
    responseRate: a.responseRate != null ? Number(a.responseRate) : null,
    platform: a.platform,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/setter-activities", requireAuth, async (req, res): Promise<void> => {
  const qp = ListSetterActivitiesQueryParams.safeParse(req.query);
  let query = db.select().from(setterActivitiesTable);
  if (qp.success && qp.data.setterId) {
    query = query.where(eq(setterActivitiesTable.setterId, qp.data.setterId)) as typeof query;
  }
  const activities = await query.orderBy(setterActivitiesTable.date);
  const serialized = await Promise.all(activities.map(serializeActivity));
  res.json(ListSetterActivitiesResponse.parse(serialized));
});

router.post("/setter-activities", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSetterActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db.insert(setterActivitiesTable).values(parsed.data).returning();
  res.status(201).json(CreateSetterActivityResponse.parse(await serializeActivity(activity)));
});

router.get("/setter-activities/stats", requireAuth, async (_req, res): Promise<void> => {
  const setters = await db.select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.role, "setter"));

  const stats = await Promise.all(setters.map(async (setter) => {
    const [agg] = await db
      .select({
        totalOutreach: sql<number>`coalesce(sum(${setterActivitiesTable.outreachCount}), 0)`,
        totalCallsBooked: sql<number>`coalesce(sum(${setterActivitiesTable.callsBooked}), 0)`,
        avgShowRate: sql<number>`coalesce(avg(${setterActivitiesTable.showRate}), 0)`,
        avgResponseRate: sql<number>`coalesce(avg(${setterActivitiesTable.responseRate}), 0)`,
      })
      .from(setterActivitiesTable)
      .where(eq(setterActivitiesTable.setterId, setter.id));

    return {
      setterId: setter.id,
      setterName: setter.name,
      totalOutreach: Number(agg.totalOutreach),
      totalCallsBooked: Number(agg.totalCallsBooked),
      avgShowRate: Number(agg.avgShowRate),
      avgResponseRate: Number(agg.avgResponseRate),
      period: "all_time",
    };
  }));

  res.json(GetSetterStatsResponse.parse(stats));
});

router.patch("/setter-activities/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateSetterActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSetterActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db.update(setterActivitiesTable).set(parsed.data).where(eq(setterActivitiesTable.id, params.data.id)).returning();
  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }
  res.json(await serializeActivity(activity));
});

router.delete("/setter-activities/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSetterActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [activity] = await db.delete(setterActivitiesTable).where(eq(setterActivitiesTable.id, params.data.id)).returning();
  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }
  res.json(DeleteSetterActivityResponse.parse({ message: "Activity deleted" }));
});

export default router;
