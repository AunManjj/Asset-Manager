export type DemoAdCampaign = {
  id: string;
  name: string;
  status: "active" | "paused" | "archived";
  platform: "Facebook" | "Instagram" | "Both";
  objective: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  dailyBudget: number;
  startDate: string;
};

export const DEMO_AD_CAMPAIGNS: DemoAdCampaign[] = [
  {
    id: "demo-1",
    name: "Spring Launch 2026 — Conversions",
    status: "active",
    platform: "Both",
    objective: "CONVERSIONS",
    spend: 12450,
    impressions: 892400,
    reach: 412000,
    clicks: 12400,
    conversions: 340,
    ctr: 1.39,
    cpc: 1.0,
    roas: 3.45,
    dailyBudget: 500,
    startDate: "2026-03-01",
  },
  {
    id: "demo-2",
    name: "Lead Gen — Real Estate Q2",
    status: "active",
    platform: "Facebook",
    objective: "LEAD_GENERATION",
    spend: 18200,
    impressions: 1200000,
    reach: 580000,
    clicks: 8900,
    conversions: 210,
    ctr: 0.74,
    cpc: 2.04,
    roas: 2.8,
    dailyBudget: 750,
    startDate: "2026-02-15",
  },
  {
    id: "demo-3",
    name: "Brand Awareness — Glow Skincare",
    status: "active",
    platform: "Instagram",
    objective: "BRAND_AWARENESS",
    spend: 9800,
    impressions: 2100000,
    reach: 890000,
    clicks: 5600,
    conversions: 95,
    ctr: 0.27,
    cpc: 1.75,
    roas: 2.1,
    dailyBudget: 400,
    startDate: "2026-04-01",
  },
  {
    id: "demo-4",
    name: "SaaS Trial Signups — Retargeting",
    status: "paused",
    platform: "Facebook",
    objective: "CONVERSIONS",
    spend: 15600,
    impressions: 650000,
    reach: 210000,
    clicks: 7200,
    conversions: 180,
    ctr: 1.11,
    cpc: 2.17,
    roas: 4.2,
    dailyBudget: 600,
    startDate: "2026-01-10",
  },
  {
    id: "demo-5",
    name: "Local Restaurant — Traffic",
    status: "active",
    platform: "Both",
    objective: "TRAFFIC",
    spend: 6200,
    impressions: 420000,
    reach: 195000,
    clicks: 9800,
    conversions: 420,
    ctr: 2.33,
    cpc: 0.63,
    roas: 1.95,
    dailyBudget: 250,
    startDate: "2026-05-01",
  },
  {
    id: "demo-6",
    name: "Webinar Registration — B2B",
    status: "active",
    platform: "Facebook",
    objective: "LEAD_GENERATION",
    spend: 8400,
    impressions: 310000,
    reach: 142000,
    clicks: 4100,
    conversions: 156,
    ctr: 1.32,
    cpc: 2.05,
    roas: 3.1,
    dailyBudget: 350,
    startDate: "2026-06-01",
  },
  {
    id: "demo-7",
    name: "Holiday Promo — Archived",
    status: "archived",
    platform: "Instagram",
    objective: "CONVERSIONS",
    spend: 22100,
    impressions: 980000,
    reach: 440000,
    clicks: 11200,
    conversions: 890,
    ctr: 1.14,
    cpc: 1.97,
    roas: 5.2,
    dailyBudget: 0,
    startDate: "2025-11-15",
  },
  {
    id: "demo-8",
    name: "Lookalike — High LTV Customers",
    status: "paused",
    platform: "Both",
    objective: "CONVERSIONS",
    spend: 11300,
    impressions: 520000,
    reach: 268000,
    clicks: 6800,
    conversions: 142,
    ctr: 1.31,
    cpc: 1.66,
    roas: 3.85,
    dailyBudget: 450,
    startDate: "2026-03-20",
  },
];

export function computeAdStats(campaigns: DemoAdCampaign[]) {
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgRoas =
    campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length : 0;
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  return { totalSpend, totalClicks, totalImpressions, totalConversions, avgCtr, avgCpc, avgRoas, activeCount };
}
