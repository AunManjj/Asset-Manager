import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, metaTokensTable, campaignsTable, adsetsTable, adsTable } from "../db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { assertClientAccess, requireAuthUser } from "../middlewares/rbac";
import {
  exchangeLongLivedToken,
  formatAdAccountId,
  getMetaTokenForClient,
  graphGet,
  graphPost,
  parseMetaInsights,
  GRAPH_VERSION,
} from "../services/meta-graph";

interface MetaTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: { message?: string };
}

interface MetaAdAccountsResponse {
  data?: Array<{ name?: string; account_id?: string }>;
}

interface MetaListResponse<T> {
  data?: T[];
  error?: { message?: string };
}

interface MetaCampaignRow {
  id: string;
  name?: string;
  status?: string;
  objective?: string;
  daily_budget?: string;
  insights?: ReturnType<typeof parseMetaInsights> extends infer R ? { data?: Array<Record<string, unknown>> } : never;
}

const router: IRouter = Router();

router.get("/meta/config", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const appId = process.env.META_APP_ID ?? "";
  const redirectUri = `${process.env.APP_BASE_URL ?? ""}/api/meta/callback`;
  res.json({
    appId,
    redirectUri,
    scopes: "ads_read,ads_management,business_management",
    connectionPath: "/settings",
    oauthPath: `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`,
    callbackPath: "/api/meta/callback",
  });
});

router.get("/meta/status/:clientId", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  if (!(await assertClientAccess(req, res, clientId))) return;

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.json({ connected: false });
    return;
  }

  res.json({
    connected: true,
    accountId: token.adAccountId,
    scopes: token.scopes,
    expiresAt: token.tokenExpiresAt,
  });
});

router.get("/meta/callback", async (req, res): Promise<void> => {
  const { code, state, error, error_description: errorDescription } = req.query;
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  if (error) {
    res.redirect(`${frontendUrl}/settings?meta=error&message=${encodeURIComponent(String(errorDescription ?? error))}`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${frontendUrl}/settings?meta=error&message=${encodeURIComponent("Missing code or state parameter")}`);
    return;
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.APP_BASE_URL ?? ""}/api/meta/callback`;
    const clientId = parseInt(state as string, 10);

    const tokenResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    const tokenData = (await tokenResponse.json()) as MetaTokenResponse;

    if (!tokenData.access_token) {
      res.redirect(
        `${frontendUrl}/settings?meta=error&message=${encodeURIComponent(tokenData.error?.message ?? "Token exchange failed")}`,
      );
      return;
    }

    const longLived = await exchangeLongLivedToken(tokenData.access_token);
    const accessToken = longLived.access_token ?? tokenData.access_token;
    const expiresIn = longLived.expires_in ?? tokenData.expires_in;

    const accountsData = await graphGet<MetaAdAccountsResponse>(
      `me/adaccounts?fields=name,account_id`,
      accessToken,
    );
    const rawAccountId = accountsData.data?.[0]?.account_id ?? "unknown";
    const adAccountId = formatAdAccountId(rawAccountId);

    await db.delete(metaTokensTable).where(eq(metaTokensTable.clientId, clientId));

    await db.insert(metaTokensTable).values({
      clientId,
      adAccountId,
      accessToken,
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      scopes: tokenData.scope ?? "ads_read,ads_management",
      isActive: "true",
    });

    res.redirect(`${frontendUrl}/settings?meta=connected&clientId=${clientId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.redirect(`${frontendUrl}/settings?meta=error&message=${encodeURIComponent(message)}`);
  }
});

router.get("/meta/campaigns/:clientId", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  if (!(await assertClientAccess(req, res, clientId))) return;

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.status(404).json({ error: "No Meta token found for this client. Connect Meta Ads first." });
    return;
  }

  try {
    const accountId = formatAdAccountId(token.adAccountId);
    const data = await graphGet(
      `${accountId}/campaigns?fields=name,status,objective,daily_budget,insights{spend,impressions,clicks,actions}&limit=50`,
      token.accessToken,
    );
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

router.get("/meta/adsets/:clientId/:metaCampaignId", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  const { metaCampaignId } = req.params;
  if (!(await assertClientAccess(req, res, clientId))) return;

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.status(404).json({ error: "Connect Meta Ads first." });
    return;
  }

  const data = await graphGet(
    `${metaCampaignId}/adsets?fields=name,status,daily_budget,targeting,optimization_goal,insights{spend,impressions,clicks}&limit=50`,
    token.accessToken,
  );
  res.json(data);
});

router.get("/meta/ads/:clientId/:metaAdsetId", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  const { metaAdsetId } = req.params;
  if (!(await assertClientAccess(req, res, clientId))) return;

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.status(404).json({ error: "Connect Meta Ads first." });
    return;
  }

  const data = await graphGet(
    `${metaAdsetId}/ads?fields=name,status,creative{title,body,image_url,link_url},insights{spend,impressions,clicks,ctr,cpc}&limit=50`,
    token.accessToken,
  );
  res.json(data);
});

router.post("/meta/campaigns/:clientId", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  const { name, objective, daily_budget, status = "PAUSED" } = req.body as {
    name?: string;
    objective?: string;
    daily_budget?: number;
    status?: string;
  };

  if (!name || !objective) {
    res.status(400).json({ error: "name and objective are required" });
    return;
  }

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.status(404).json({ error: "Connect Meta Ads first." });
    return;
  }

  const accountId = formatAdAccountId(token.adAccountId);
  const body: Record<string, string> = {
    name,
    objective,
    status,
    special_ad_categories: "[]",
  };
  if (daily_budget) body.daily_budget = String(Math.round(daily_budget * 100));

  const result = await graphPost<{ id?: string; error?: { message?: string } }>(`${accountId}/campaigns`, token.accessToken, body);
  if (result.error?.message) {
    res.status(400).json({ error: result.error.message });
    return;
  }

  const [campaign] = await db
    .insert(campaignsTable)
    .values({
      name,
      clientId,
      metaCampaignId: result.id,
      status: status.toLowerCase() === "active" ? "active" : "paused",
      objective,
      dailyBudget: daily_budget ? String(daily_budget) : null,
    })
    .returning();

  res.status(201).json({ metaCampaignId: result.id, campaign });
});

router.post("/meta/campaigns/:clientId/:metaCampaignId/status", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  const { metaCampaignId } = req.params;
  const { status } = req.body as { status?: "ACTIVE" | "PAUSED" };
  if (!(await assertClientAccess(req, res, clientId))) return;
  if (!status || !["ACTIVE", "PAUSED"].includes(status)) {
    res.status(400).json({ error: "status must be ACTIVE or PAUSED" });
    return;
  }

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.status(404).json({ error: "Connect Meta Ads first." });
    return;
  }

  const result = await graphPost<{ success?: boolean; error?: { message?: string } }>(
    metaCampaignId,
    token.accessToken,
    { status },
  );
  if (result.error?.message) {
    res.status(400).json({ error: result.error.message });
    return;
  }

  await db
    .update(campaignsTable)
    .set({ status: status === "ACTIVE" ? "active" : "paused" })
    .where(and(eq(campaignsTable.clientId, clientId), eq(campaignsTable.metaCampaignId, metaCampaignId)));

  res.json({ success: true, status });
});

router.post("/meta/sync/:clientId", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(String(req.params.clientId), 10);
  if (!(await assertClientAccess(req, res, clientId))) return;

  const token = await getMetaTokenForClient(clientId);
  if (!token) {
    res.status(404).json({ error: "Connect Meta Ads first." });
    return;
  }

  const accountId = formatAdAccountId(token.adAccountId);
  const campaignsData = await graphGet<MetaListResponse<MetaCampaignRow>>(
    `${accountId}/campaigns?fields=id,name,status,objective,daily_budget,insights{spend,impressions,clicks,actions}&limit=50`,
    token.accessToken,
  );

  let syncedCampaigns = 0;
  let syncedAdsets = 0;
  let syncedAds = 0;

  for (const mc of campaignsData.data ?? []) {
    const metrics = parseMetaInsights(mc.insights as Parameters<typeof parseMetaInsights>[0]);
    const status = (mc.status ?? "PAUSED").toLowerCase();

    const [existing] = await db
      .select()
      .from(campaignsTable)
      .where(and(eq(campaignsTable.clientId, clientId), eq(campaignsTable.metaCampaignId, mc.id)));

    if (existing) {
      await db
        .update(campaignsTable)
        .set({
          name: mc.name ?? existing.name,
          status: status === "active" ? "active" : status === "paused" ? "paused" : existing.status,
          objective: mc.objective ?? existing.objective,
          dailyBudget: mc.daily_budget ? String(parseInt(mc.daily_budget, 10) / 100) : existing.dailyBudget,
          spend: String(metrics.spend),
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
        })
        .where(eq(campaignsTable.id, existing.id));
    } else {
      await db.insert(campaignsTable).values({
        name: mc.name ?? "Meta Campaign",
        clientId,
        metaCampaignId: mc.id,
        status: status === "active" ? "active" : "paused",
        objective: mc.objective ?? "CONVERSIONS",
        dailyBudget: mc.daily_budget ? String(parseInt(mc.daily_budget, 10) / 100) : null,
        spend: String(metrics.spend),
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
      });
    }
    syncedCampaigns++;

    const adsetsData = await graphGet<MetaListResponse<{ id: string; name?: string; status?: string; daily_budget?: string; targeting?: unknown; optimization_goal?: string; insights?: Parameters<typeof parseMetaInsights>[0] }>>(
      `${mc.id}/adsets?fields=id,name,status,daily_budget,targeting,optimization_goal,insights{spend,impressions,clicks}&limit=50`,
      token.accessToken,
    );

    const [localCampaign] = await db
      .select()
      .from(campaignsTable)
      .where(and(eq(campaignsTable.clientId, clientId), eq(campaignsTable.metaCampaignId, mc.id)));

    if (!localCampaign) continue;

    for (const ma of adsetsData.data ?? []) {
      const adsetMetrics = parseMetaInsights(ma.insights);
      const [existingAdset] = await db
        .select()
        .from(adsetsTable)
        .where(and(eq(adsetsTable.campaignId, localCampaign.id), eq(adsetsTable.metaAdsetId, ma.id)));

      let adsetId: number;
      if (existingAdset) {
        await db
          .update(adsetsTable)
          .set({
            name: ma.name ?? existingAdset.name,
            status: (ma.status ?? "PAUSED").toLowerCase(),
            dailyBudget: ma.daily_budget ? String(parseInt(ma.daily_budget, 10) / 100) : existingAdset.dailyBudget,
            targeting: ma.targeting ? JSON.stringify(ma.targeting) : existingAdset.targeting,
            optimizationGoal: ma.optimization_goal ?? existingAdset.optimizationGoal,
            spend: String(adsetMetrics.spend),
            impressions: adsetMetrics.impressions,
            clicks: adsetMetrics.clicks,
          })
          .where(eq(adsetsTable.id, existingAdset.id));
        adsetId = existingAdset.id;
      } else {
        const [inserted] = await db
          .insert(adsetsTable)
          .values({
            name: ma.name ?? "Ad Set",
            campaignId: localCampaign.id,
            metaAdsetId: ma.id,
            status: (ma.status ?? "PAUSED").toLowerCase(),
            dailyBudget: ma.daily_budget ? String(parseInt(ma.daily_budget, 10) / 100) : null,
            targeting: ma.targeting ? JSON.stringify(ma.targeting) : null,
            optimizationGoal: ma.optimization_goal ?? null,
            spend: String(adsetMetrics.spend),
            impressions: adsetMetrics.impressions,
            clicks: adsetMetrics.clicks,
          })
          .returning();
        adsetId = inserted.id;
      }
      syncedAdsets++;

      const adsData = await graphGet<MetaListResponse<{ id: string; name?: string; status?: string; creative?: { title?: string; body?: string; image_url?: string; link_url?: string }; insights?: { data?: Array<{ spend?: string; impressions?: string; clicks?: string; ctr?: string; cpc?: string }> } }>>(
        `${ma.id}/ads?fields=id,name,status,creative{title,body,image_url,link_url},insights{spend,impressions,clicks,ctr,cpc}&limit=50`,
        token.accessToken,
      );

      for (const ad of adsData.data ?? []) {
        const insight = ad.insights?.data?.[0];
        const [existingAd] = await db
          .select()
          .from(adsTable)
          .where(and(eq(adsTable.adsetId, adsetId), eq(adsTable.metaAdId, ad.id)));

        const adValues = {
          name: ad.name ?? "Ad",
          status: (ad.status ?? "PAUSED").toLowerCase(),
          headline: ad.creative?.title ?? null,
          body: ad.creative?.body ?? null,
          imageUrl: ad.creative?.image_url ?? null,
          destinationUrl: ad.creative?.link_url ?? null,
          spend: insight?.spend ?? "0",
          impressions: parseInt(insight?.impressions ?? "0", 10),
          clicks: parseInt(insight?.clicks ?? "0", 10),
          ctr: insight?.ctr ?? null,
          cpc: insight?.cpc ?? null,
        };

        if (existingAd) {
          await db.update(adsTable).set(adValues).where(eq(adsTable.id, existingAd.id));
        } else {
          await db.insert(adsTable).values({ ...adValues, adsetId, metaAdId: ad.id });
        }
        syncedAds++;
      }
    }
  }

  res.json({
    message: "Meta data synced to dashboard",
    synced: { campaigns: syncedCampaigns, adsets: syncedAdsets, ads: syncedAds },
  });
});

router.post("/meta/webhook/n8n", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { clientId, campaigns, adsets, ads, insights } = req.body;
  if (!clientId || !campaigns) {
    res.status(400).json({ error: "Missing clientId or campaigns data" });
    return;
  }

  req.log?.info({ clientId, campaignCount: campaigns.length }, "Received n8n webhook with Meta data");

  for (const c of campaigns) {
    await db
      .insert(metaTokensTable)
      .values({
        clientId,
        adAccountId: c.account_id ? formatAdAccountId(c.account_id) : "",
        accessToken: "n8n-managed",
        scopes: "n8n",
      })
      .onConflictDoNothing();
  }

  res.json({
    message: "Meta data received from n8n",
    processed: {
      campaigns: campaigns.length,
      adsets: adsets?.length ?? 0,
      ads: ads?.length ?? 0,
      insights: insights?.length ?? 0,
    },
  });
});

export default router;
