import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable, clientsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListCampaignsResponse,
  GetCampaignResponse,
  GetCampaignParams,
  CreateCampaignBody,
  UpdateCampaignBody,
  UpdateCampaignParams,
  DeleteCampaignParams,
  DeleteCampaignResponse,
  PauseCampaignParams,
  ResumeCampaignParams,
  ListCampaignsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function serializeCampaign(c: typeof campaignsTable.$inferSelect) {
  let clientName: string | null = null;
  if (c.clientId) {
    const [cl] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, c.clientId));
    clientName = cl?.name ?? null;
  }
  return {
    id: c.id,
    name: c.name,
    clientId: c.clientId,
    clientName,
    metaCampaignId: c.metaCampaignId,
    status: c.status,
    objective: c.objective,
    dailyBudget: c.dailyBudget != null ? Number(c.dailyBudget) : null,
    totalBudget: c.totalBudget != null ? Number(c.totalBudget) : null,
    startDate: c.startDate,
    endDate: c.endDate,
    spend: c.spend != null ? Number(c.spend) : null,
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions,
    roas: c.roas != null ? Number(c.roas) : null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/campaigns", requireAuth, async (req, res): Promise<void> => {
  const qp = ListCampaignsQueryParams.safeParse(req.query);
  let query = db.select().from(campaignsTable);
  if (qp.success && qp.data.clientId) {
    query = query.where(eq(campaignsTable.clientId, qp.data.clientId)) as typeof query;
  }
  const campaigns = await query.orderBy(campaignsTable.createdAt);
  const serialized = await Promise.all(campaigns.map(serializeCampaign));
  res.json(ListCampaignsResponse.parse(serialized));
});

router.post("/campaigns", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [campaign] = await db.insert(campaignsTable).values({ ...parsed.data, status: "active" }).returning();
  res.status(201).json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

router.get("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, params.data.id));
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

router.patch("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [campaign] = await db.update(campaignsTable).set(parsed.data).where(eq(campaignsTable.id, params.data.id)).returning();
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

router.delete("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [campaign] = await db.delete(campaignsTable).where(eq(campaignsTable.id, params.data.id)).returning();
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(DeleteCampaignResponse.parse({ message: "Campaign deleted" }));
});

router.post("/campaigns/:id/pause", requireAuth, async (req, res): Promise<void> => {
  const params = PauseCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [campaign] = await db.update(campaignsTable).set({ status: "paused" }).where(eq(campaignsTable.id, params.data.id)).returning();
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

router.post("/campaigns/:id/resume", requireAuth, async (req, res): Promise<void> => {
  const params = ResumeCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [campaign] = await db.update(campaignsTable).set({ status: "active" }).where(eq(campaignsTable.id, params.data.id)).returning();
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

export default router;
