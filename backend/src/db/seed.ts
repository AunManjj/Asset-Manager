import "../load-env.js";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import {
  usersTable,
  clientsTable,
  campaignsTable,
  insightsTable,
  revenueTable,
  setterActivitiesTable,
  closerActivitiesTable,
  notificationsTable,
  aiInsightsTable,
  reportsTable,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  await db.execute(sql`TRUNCATE TABLE 
    ai_insights, reports, notifications, closer_activities, setter_activities,
    insights, revenue, campaigns, meta_tokens, ads, adsets, clients, users,
    slack_logs RESTART IDENTITY CASCADE`);

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin] = await db
    .insert(usersTable)
    .values({
      email: "admin@agencyos.com",
      name: "Admin User",
      passwordHash,
      role: "admin",
    })
    .returning();

  const clientRows = await db
    .insert(clientsTable)
    .values([
      { name: "Nova Fitness", industry: "Health & Wellness", contactName: "Sarah Chen", contactEmail: "sarah@novafitness.com", status: "active", monthlyBudget: "15000" },
      { name: "Peak Realty", industry: "Real Estate", contactName: "Marcus Webb", contactEmail: "marcus@peakrealty.com", status: "active", monthlyBudget: "22000" },
      { name: "Glow Skincare", industry: "Beauty", contactName: "Elena Rossi", contactEmail: "elena@glowskin.com", status: "active", monthlyBudget: "12000" },
      { name: "TechFlow SaaS", industry: "Technology", contactName: "James Park", contactEmail: "james@techflow.io", status: "active", monthlyBudget: "30000" },
      { name: "Urban Eats", industry: "Food & Beverage", contactName: "Priya Patel", contactEmail: "priya@urbaneats.com", status: "active", monthlyBudget: "8500" },
    ])
    .returning();

  await db.insert(usersTable).values([
    { email: "closer@agencyos.com", name: "Alex Closer", passwordHash, role: "closer" },
    { email: "setter@agencyos.com", name: "Jordan Setter", passwordHash, role: "setter" },
    { email: "client@agencyos.com", name: "Client User", passwordHash, role: "client", clientId: clientRows[0].id },
  ]);

  const campaignRows = await db
    .insert(campaignsTable)
    .values([
      { name: "Spring Launch 2026", clientId: clientRows[0].id, status: "active", objective: "CONVERSIONS", dailyBudget: "500", spend: "12450", impressions: 890000, clicks: 12400, conversions: 340, roas: "3.45" },
      { name: "Lead Gen - Real Estate", clientId: clientRows[1].id, status: "active", objective: "LEAD_GENERATION", dailyBudget: "750", spend: "18200", impressions: 1200000, clicks: 8900, conversions: 210, roas: "2.80" },
      { name: "Brand Awareness Q1", clientId: clientRows[2].id, status: "active", objective: "BRAND_AWARENESS", dailyBudget: "400", spend: "9800", impressions: 2100000, clicks: 5600, conversions: 95, roas: "2.10" },
      { name: "SaaS Trial Signups", clientId: clientRows[3].id, status: "paused", objective: "CONVERSIONS", dailyBudget: "600", spend: "15600", impressions: 650000, clicks: 7200, conversions: 180, roas: "4.20" },
      { name: "Local Restaurant Promo", clientId: clientRows[4].id, status: "active", objective: "TRAFFIC", dailyBudget: "250", spend: "6200", impressions: 420000, clicks: 9800, conversions: 420, roas: "1.95" },
    ])
    .returning();

  for (const campaign of campaignRows) {
    await db.insert(insightsTable).values({
      campaignId: campaign.id,
      date: "2026-06-01",
      spend: campaign.spend ?? "0",
      impressions: campaign.impressions ?? 0,
      clicks: campaign.clicks ?? 0,
      conversions: campaign.conversions ?? 0,
      ctr: "1.45",
      cpc: "2.15",
      cpm: "8.50",
      roas: campaign.roas ?? "2.00",
      reach: 150000,
      frequency: "1.8",
    });
  }

  await db.insert(revenueTable).values([
    { clientId: clientRows[0].id, amount: "18500", type: "new_deal", date: "2026-06-15", description: "Annual membership package" },
    { clientId: clientRows[1].id, amount: "22000", type: "new_deal", date: "2026-06-10", description: "Premium listing bundle" },
    { clientId: clientRows[2].id, amount: "9800", type: "new_deal", date: "2026-06-08", description: "Product launch campaign" },
    { clientId: clientRows[3].id, amount: "31000", type: "new_deal", date: "2026-06-20", description: "Enterprise SaaS contract" },
    { clientId: clientRows[4].id, amount: "9700", type: "new_deal", date: "2026-06-12", description: "Franchise expansion deal" },
  ]);

  const [setter] = await db.select().from(usersTable).where(eq(usersTable.email, "setter@agencyos.com"));
  const [closer] = await db.select().from(usersTable).where(eq(usersTable.email, "closer@agencyos.com"));

  if (setter) {
    await db.insert(setterActivitiesTable).values([
      { setterId: setter.id, date: "2026-06-28", outreachCount: 45, callsBooked: 8, showRate: "72.50", responseRate: "38.00", platform: "Instagram" },
      { setterId: setter.id, date: "2026-06-27", outreachCount: 38, callsBooked: 6, showRate: "68.00", responseRate: "35.00", platform: "Facebook" },
    ]);
  }

  if (closer) {
    await db.insert(closerActivitiesTable).values([
      { closerId: closer.id, clientId: clientRows[0].id, date: "2026-06-28", callsTaken: 12, dealsWon: 4, revenue: "8500", closeRate: "33.33", avgDealSize: "2125" },
      { closerId: closer.id, clientId: clientRows[1].id, date: "2026-06-27", callsTaken: 10, dealsWon: 3, revenue: "6200", closeRate: "30.00", avgDealSize: "2066" },
    ]);
  }

  await db.insert(notificationsTable).values([
    { type: "alert", title: "ROAS Drop Alert", message: "Glow Skincare ROAS dropped 22% below 28-day average", isRead: false },
    { type: "info", title: "Campaign Paused", message: "SaaS Trial Signups was paused by admin", isRead: false },
    { type: "success", title: "Deal Closed", message: "TechFlow SaaS closed $31,000 deal", isRead: true },
  ]);

  await db.insert(aiInsightsTable).values([
    { clientId: clientRows[0].id, type: "performance_analysis", content: "Nova Fitness campaigns are outperforming last month by 18%. Consider increasing daily budget on Spring Launch.", model: "gpt-4o" },
    { clientId: clientRows[3].id, type: "recommendations", content: "SaaS Trial Signups had the highest ROAS at 4.2x before pause. Recommend resuming with adjusted targeting.", model: "gpt-4o" },
  ]);

  await db.insert(reportsTable).values([
    { clientId: clientRows[0].id, type: "weekly", title: "Weekly Performance Report", status: "completed", dateFrom: "2026-06-21", dateTo: "2026-06-28" },
    { clientId: clientRows[1].id, type: "monthly", title: "June Monthly Report", status: "completed", dateFrom: "2026-06-01", dateTo: "2026-06-30" },
  ]);

  console.log("Seed complete.");
  console.log("Login: admin@agencyos.com / password123");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
