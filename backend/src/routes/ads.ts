import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  ListAdsResponse,
  GetAdResponse,
  GetAdParams,
  CreateAdBody,
  UpdateAdBody,
  UpdateAdParams,
  DeleteAdParams,
  DeleteAdResponse,
  ListAdsQueryParams,
} from "../validation";

const router: IRouter = Router();

function serializeAd(a: typeof adsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    adsetId: a.adsetId,
    metaAdId: a.metaAdId,
    status: a.status,
    headline: a.headline,
    body: a.body,
    imageUrl: a.imageUrl,
    destinationUrl: a.destinationUrl,
    spend: a.spend != null ? Number(a.spend) : null,
    impressions: a.impressions,
    clicks: a.clicks,
    ctr: a.ctr != null ? Number(a.ctr) : null,
    cpc: a.cpc != null ? Number(a.cpc) : null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/ads", requireAuth, async (req, res): Promise<void> => {
  const qp = ListAdsQueryParams.safeParse(req.query);
  let query = db.select().from(adsTable);
  if (qp.success && qp.data.adsetId) {
    query = query.where(eq(adsTable.adsetId, qp.data.adsetId)) as typeof query;
  }
  const ads = await query.orderBy(adsTable.createdAt);
  res.json(ListAdsResponse.parse(ads.map(serializeAd)));
});

router.post("/ads", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ad] = await db.insert(adsTable).values({ ...parsed.data, status: "active" }).returning();
  res.status(201).json(GetAdResponse.parse(serializeAd(ad)));
});

router.get("/ads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetAdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, params.data.id));
  if (!ad) {
    res.status(404).json({ error: "Ad not found" });
    return;
  }
  res.json(GetAdResponse.parse(serializeAd(ad)));
});

router.patch("/ads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateAdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAdBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ad] = await db.update(adsTable).set(parsed.data).where(eq(adsTable.id, params.data.id)).returning();
  if (!ad) {
    res.status(404).json({ error: "Ad not found" });
    return;
  }
  res.json(GetAdResponse.parse(serializeAd(ad)));
});

router.delete("/ads/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteAdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [ad] = await db.delete(adsTable).where(eq(adsTable.id, params.data.id)).returning();
  if (!ad) {
    res.status(404).json({ error: "Ad not found" });
    return;
  }
  res.json(DeleteAdResponse.parse({ message: "Ad deleted" }));
});

export default router;
