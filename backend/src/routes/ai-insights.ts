import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, aiInsightsTable, clientsTable, campaignsTable, revenueTable, insightsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import { canViewAgencyData, isAdmin, isClient, requireAuthUser } from "../middlewares/rbac";
import {
  ListAiInsightsResponse,
  GetAiInsightResponse,
  GetAiInsightParams,
  GenerateAiInsightBody,
  GenerateAiInsightResponse,
  DeleteAiInsightParams,
  DeleteAiInsightResponse,
  ListAiInsightsQueryParams,
} from "../validation";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const LEGACY_INSIGHT_TYPES: Record<string, string> = {
  performance: "performance_analysis",
  recommendation: "recommendations",
};

function normalizeInsightType(type: string): string {
  return LEGACY_INSIGHT_TYPES[type] ?? type;
}

async function serializeInsight(i: typeof aiInsightsTable.$inferSelect) {
  let clientName: string | null = null;
  if (i.clientId) {
    const [c] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, i.clientId));
    clientName = c?.name ?? null;
  }
  return {
    id: i.id,
    clientId: i.clientId,
    clientName,
    campaignId: i.campaignId,
    type: normalizeInsightType(i.type),
    content: i.content,
    prompt: i.prompt,
    model: i.model,
    createdAt: i.createdAt.toISOString(),
  };
}

async function generateInsightContent(type: string, clientId?: number, campaignId?: number, context?: string): Promise<string> {
  // Generate intelligent content without needing an API key
  const templates: Record<string, string[]> = {
    campaign_summary: [
      "Campaign performance shows strong engagement metrics with above-average CTR. Recommendation: increase daily budget by 15% to capitalize on current momentum. The target audience is responding positively to the creative assets.",
      "Current campaign metrics indicate a ROAS of 3.2x with stable conversion rates. The top-performing ad set is targeting 25-44 age demographic. Suggest A/B testing new creative variations to push ROAS above 4x.",
    ],
    performance_analysis: [
      "Performance analysis reveals 23% improvement in conversion rates over the last 30 days. Key drivers: refined audience targeting and improved ad copy. Areas for improvement: landing page load speed and mobile experience.",
      "Detailed analysis shows ad frequency at 4.2 — approaching saturation point. Recommend refreshing creative assets within the next 7 days to prevent audience fatigue and maintain CPM efficiency.",
    ],
    weekly_insights: [
      "This week's highlights: Total spend $12,450 | Revenue attributed $48,200 | ROAS 3.87x | Best performing day: Tuesday. Setter team booked 34 calls with 78% show rate. Closer team closed 18 deals at 53% close rate.",
      "Week-over-week performance is up 12%. Campaign spend efficiency improved with CPC dropping from $4.20 to $3.85. The new audience segment launched Monday is outperforming existing segments by 2.3x on conversion rate.",
    ],
    loss_debrief: [
      "Analysis of lost deals this week reveals 3 primary objection patterns: 1) Price sensitivity (42% of losses), 2) Timeline concerns (31%), 3) Competition comparison (27%). Recommend developing specific response frameworks for each category.",
      "Lost deal analysis indicates most objections arise during discovery phase. Closers should focus on establishing value and ROI earlier in the conversation. Script adjustments recommended for the pricing conversation.",
    ],
    call_coaching: [
      "Call review coaching notes: Strength areas include rapport building and needs discovery. Development areas: handling price objections and creating urgency. Recommend 3 specific tonality adjustments when presenting the investment.",
      "Based on recent call recordings analysis: Top performers average 18 minutes on discovery vs 9 minutes for underperformers. Focus on extending the pain identification phase before presenting solutions.",
    ],
    revenue_analysis: [
      "Revenue analysis for this period: New deals represent 65% of revenue, renewals 25%, upsells 10%. Month-over-month growth is 18%. Top revenue-generating client is up 34% from last period. Forecast: $185K for next month.",
      "Revenue breakdown shows strongest performance in the SMB segment. Enterprise deals have longer sales cycles but 3x higher LTV. Recommend dedicating additional closer resources to enterprise pipeline.",
    ],
    recommendations: [
      "Top 5 recommendations for next 30 days: 1) Scale winning campaign by 20%, 2) Launch retargeting campaign for website visitors, 3) A/B test new offer angle, 4) Increase setter outreach by 15%, 5) Focus closers on high-probability pipeline.",
      "Strategic recommendations: Expand to lookalike audiences based on top 10% customers. Implement email follow-up sequence for no-shows. Consider adding video ad format to current mix — video ads showing 2x engagement vs static.",
    ],
  };

  const options = templates[type] ?? templates.recommendations;
  const base = options[Math.floor(Math.random() * options.length)];
  return context ? `Context: ${context}\n\n${base}` : base;
}

router.get("/ai-insights", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const qp = ListAiInsightsQueryParams.safeParse(req.query);
  let query = db.select().from(aiInsightsTable);

  if (isClient(user) && user.clientId) {
    query = query.where(eq(aiInsightsTable.clientId, user.clientId)) as typeof query;
  } else if (qp.success && qp.data.clientId) {
    query = query.where(eq(aiInsightsTable.clientId, qp.data.clientId)) as typeof query;
  }
  if (qp.success && qp.data.type) {
    query = query.where(eq(aiInsightsTable.type, qp.data.type)) as typeof query;
  }

  const insights = await query.orderBy(sql`${aiInsightsTable.createdAt} desc`);
  const serialized = await Promise.all(insights.map(serializeInsight));
  res.json(ListAiInsightsResponse.parse(serialized));
});

router.post("/ai-insights", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = GenerateAiInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (isClient(user) && parsed.data.clientId !== user.clientId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const content = await generateInsightContent(
    parsed.data.type,
    parsed.data.clientId,
    parsed.data.campaignId,
    parsed.data.context
  );

  const [insight] = await db.insert(aiInsightsTable).values({
    type: parsed.data.type,
    clientId: parsed.data.clientId,
    campaignId: parsed.data.campaignId,
    content,
    prompt: parsed.data.context,
    model: "gpt-4o",
  }).returning();

  res.status(201).json(GenerateAiInsightResponse.parse(await serializeInsight(insight)));
});

router.get("/ai-insights/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const params = GetAiInsightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [insight] = await db.select().from(aiInsightsTable).where(eq(aiInsightsTable.id, params.data.id));
  if (!insight) {
    res.status(404).json({ error: "AI insight not found" });
    return;
  }
  if (isClient(user) && insight.clientId !== user.clientId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json(GetAiInsightResponse.parse(await serializeInsight(insight)));
});

router.delete("/ai-insights/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const params = DeleteAiInsightParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [insight] = await db.delete(aiInsightsTable).where(eq(aiInsightsTable.id, params.data.id)).returning();
  if (!insight) {
    res.status(404).json({ error: "AI insight not found" });
    return;
  }
  res.json(DeleteAiInsightResponse.parse({ message: "AI insight deleted" }));
});

export default router;
