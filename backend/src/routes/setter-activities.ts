import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, setterActivitiesTable, usersTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  isAdmin,
  isSetter,
  requireAuthUser,
  resolveSetterScope,
} from "../middlewares/rbac";
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
} from "../validation";

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

async function assertActivityAccess(req: Parameters<typeof requireAuthUser>[0], res: Parameters<typeof requireAuthUser>[1], activityId: number) {
  const user = await requireAuthUser(req, res);
  if (!user) return null;
  const [activity] = await db.select().from(setterActivitiesTable).where(eq(setterActivitiesTable.id, activityId));
  if (!activity) {
    res.status(404).json({ error: "Activity not found" });
    return null;
  }
  if (isSetter(user) && activity.setterId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  if (!isAdmin(user) && !isSetter(user)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return { user, activity };
}

router.get("/setter-activities", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user) return;

  const qp = ListSetterActivitiesQueryParams.safeParse(req.query);
  const scope = resolveSetterScope(user, qp.success ? qp.data.setterId : undefined);
  if (scope === "forbidden") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  let query = db.select().from(setterActivitiesTable);
  if (scope !== "all") {
    query = query.where(eq(setterActivitiesTable.setterId, scope)) as typeof query;
  }
  const activities = await query.orderBy(setterActivitiesTable.date);
  const serialized = await Promise.all(activities.map(serializeActivity));
  res.json(ListSetterActivitiesResponse.parse(serialized));
});

router.post("/setter-activities", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user) return;

  const parsed = CreateSetterActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const setterId = isSetter(user) ? user.id : parsed.data.setterId;
  if (isSetter(user) && parsed.data.setterId !== user.id) {
    res.status(403).json({ error: "Setters can only log their own activity" });
    return;
  }
  if (!isAdmin(user) && !isSetter(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [activity] = await db
    .insert(setterActivitiesTable)
    .values({ ...parsed.data, setterId })
    .returning();
  res.status(201).json(CreateSetterActivityResponse.parse(await serializeActivity(activity)));
});

router.get("/setter-activities/stats", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user) return;

  const scope = resolveSetterScope(user);
  if (scope === "forbidden") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const settersQuery = db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.role, "setter"));
  const setters =
    scope === "all"
      ? await settersQuery
      : await settersQuery.where(eq(usersTable.id, scope));

  const stats = await Promise.all(
    setters.map(async (setter) => {
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
    }),
  );

  res.json(GetSetterStatsResponse.parse(stats));
});

router.patch("/setter-activities/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateSetterActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const access = await assertActivityAccess(req, res, params.data.id);
  if (!access) return;

  const parsed = UpdateSetterActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db
    .update(setterActivitiesTable)
    .set(parsed.data)
    .where(eq(setterActivitiesTable.id, params.data.id))
    .returning();
  res.json(await serializeActivity(activity));
});

router.delete("/setter-activities/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteSetterActivityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const access = await assertActivityAccess(req, res, params.data.id);
  if (!access) return;

  await db.delete(setterActivitiesTable).where(eq(setterActivitiesTable.id, params.data.id));
  res.json(DeleteSetterActivityResponse.parse({ message: "Activity deleted" }));
});

export default router;
