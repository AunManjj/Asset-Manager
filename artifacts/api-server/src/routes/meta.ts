import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, metaTokensTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

// Meta OAuth configuration endpoint - returns app ID and redirect URI for frontend
router.get("/meta/config", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const appId = process.env.META_APP_ID ?? "";
  const redirectUri = `${process.env.APP_BASE_URL ?? ""}/api/meta/callback`;
  res.json({ appId, redirectUri, scopes: "ads_read,ads_management,business_management" });
});

// OAuth callback handler - Facebook redirects here after user authorization
router.get("/meta/callback", async (req, res): Promise<void> => {
  const { code, state } = req.query;
  if (!code || !state) {
    res.status(400).json({ error: "Missing code or state parameter" });
    return;
  }

  try {
    // Exchange code for access token with Meta
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.APP_BASE_URL ?? ""}/api/meta/callback`;

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    );
    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      res.status(400).json({ error: tokenData.error?.message ?? "Token exchange failed" });
      return;
    }

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}&fields=name,account_id`,
    );
    const accountsData = await accountsResponse.json();

    // The state parameter contains the clientId we need to associate
    const clientId = parseInt(state as string, 10);

    // Store the token
    const [token] = await db
      .insert(metaTokensTable)
      .values({
        clientId,
        adAccountId: accountsData.data?.[0]?.account_id ?? "unknown",
        accessToken: tokenData.access_token,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
        scopes: tokenData.scope ?? "ads_read,ads_management",
      })
      .returning();

    res.json({
      message: "Meta Ads connected successfully",
      accountName: accountsData.data?.[0]?.name,
      accountId: accountsData.data?.[0]?.account_id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch campaigns from Meta Ads API (proxy through our server)
router.get("/meta/campaigns/:clientId", requireAuth, async (req, res): Promise<void> => {
  const clientId = parseInt(req.params.clientId, 10);
  const [token] = await db
    .select()
    .from(metaTokensTable)
    .where(eq(metaTokensTable.clientId, clientId))
    .orderBy(metaTokensTable.createdAt);

  if (!token) {
    res.status(404).json({ error: "No Meta token found for this client. Connect Meta Ads first." });
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${token.adAccountId}/campaigns?access_token=${token.accessToken}&fields=name,status,objective,daily_budget,spend&limit=50`,
    );
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook endpoint for n8n automation
router.post("/meta/webhook/n8n", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { clientId, campaigns, adsets, ads, insights } = req.body;
  if (!clientId || !campaigns) {
    res.status(400).json({ error: "Missing clientId or campaigns data" });
    return;
  }

  req.log?.info({ clientId, campaignCount: campaigns.length }, "Received n8n webhook with Meta data");

  // Upsert campaigns from Meta data
  for (const c of campaigns) {
    await db
      .insert(metaTokensTable)
      .values({
        clientId,
        adAccountId: c.account_id ?? "",
        accessToken: "n8n-managed",
        scopes: "n8n",
      })
      .onConflictDoNothing();
  }

  res.json({
    message: "Meta data received from n8n",
    processed: { campaigns: campaigns.length, adsets: adsets?.length ?? 0, ads: ads?.length ?? 0, insights: insights?.length ?? 0 },
  });
});

export default router;
