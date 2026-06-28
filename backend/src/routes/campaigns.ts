import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable, clientsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  canViewAgencyData,
  isAdmin,
  isClient,
  requireAuthUser,
  resolveClientScope,
} from "../middlewares/rbac";
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
} from "../validation";

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
  const user = await requireAuthUser(req, res);
  if (!user) return;
  if (!canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const qp = ListCampaignsQueryParams.safeParse(req.query);
  const scope = resolveClientScope(user, qp.success ? qp.data.clientId : undefined);
  if (scope === "forbidden") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  let query = db.select().from(campaignsTable);
  if (scope !== "all") {
    query = query.where(eq(campaignsTable.clientId, scope)) as typeof query;
  }
  const campaigns = await query.orderBy(campaignsTable.createdAt);
  const serialized = await Promise.all(campaigns.map(serializeCampaign));
  res.json(ListCampaignsResponse.parse(serialized));
});

router.post("/campaigns", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [campaign] = await db.insert(campaignsTable).values({ ...parsed.data, status: "active" }).returning();
  res.status(201).json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

router.get("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
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
  if (isClient(user) && campaign.clientId !== user.clientId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(GetCampaignResponse.parse(await serializeCampaign(campaign)));
});

router.patch("/campaigns/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
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
  const user = await requireAuthUser(req, res);
  if (!user || !isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
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
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = PauseCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (isClient(user) && existing.clientId !== user.clientId) {
    res.status(403).json({ error: "Forbidden" });
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
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = ResumeCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (isClient(user) && existing.clientId !== user.clientId) {
    res.status(403).json({ error: "Forbidden" });
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
