import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adsetsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  ListAdsetsResponse,
  GetAdsetResponse,
  GetAdsetParams,
  CreateAdsetBody,
  UpdateAdsetBody,
  UpdateAdsetParams,
  DeleteAdsetParams,
  DeleteAdsetResponse,
  ListAdsetsQueryParams,
} from "../validation";

const router: IRouter = Router();

function serializeAdset(a: typeof adsetsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    campaignId: a.campaignId,
    metaAdsetId: a.metaAdsetId,
    status: a.status,
    dailyBudget: a.dailyBudget != null ? Number(a.dailyBudget) : null,
    targeting: a.targeting,
    optimizationGoal: a.optimizationGoal,
    spend: a.spend != null ? Number(a.spend) : null,
    impressions: a.impressions,
    clicks: a.clicks,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/adsets", requireAuth, async (req, res): Promise<void> => {
  const qp = ListAdsetsQueryParams.safeParse(req.query);
  let query = db.select().from(adsetsTable);
  if (qp.success && qp.data.campaignId) {
    query = query.where(eq(adsetsTable.campaignId, qp.data.campaignId)) as typeof query;
  }
  const adsets = await query.orderBy(adsetsTable.createdAt);
  res.json(ListAdsetsResponse.parse(adsets.map(serializeAdset)));
});

router.post("/adsets", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAdsetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [adset] = await db.insert(adsetsTable).values({ ...parsed.data, status: "active" }).returning();
  res.status(201).json(GetAdsetResponse.parse(serializeAdset(adset)));
});

router.get("/adsets/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetAdsetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [adset] = await db.select().from(adsetsTable).where(eq(adsetsTable.id, params.data.id));
  if (!adset) {
    res.status(404).json({ error: "Adset not found" });
    return;
  }
  res.json(GetAdsetResponse.parse(serializeAdset(adset)));
});

router.patch("/adsets/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateAdsetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAdsetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [adset] = await db.update(adsetsTable).set(parsed.data).where(eq(adsetsTable.id, params.data.id)).returning();
  if (!adset) {
    res.status(404).json({ error: "Adset not found" });
    return;
  }
  res.json(GetAdsetResponse.parse(serializeAdset(adset)));
});

router.delete("/adsets/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteAdsetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [adset] = await db.delete(adsetsTable).where(eq(adsetsTable.id, params.data.id)).returning();
  if (!adset) {
    res.status(404).json({ error: "Adset not found" });
    return;
  }
  res.json(DeleteAdsetResponse.parse({ message: "Adset deleted" }));
});

export default router;
