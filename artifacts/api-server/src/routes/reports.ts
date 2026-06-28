import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reportsTable, clientsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListReportsResponse,
  GetReportResponse,
  GetReportParams,
  CreateReportBody,
  CreateReportResponse,
  DeleteReportParams,
  DeleteReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function serializeReport(r: typeof reportsTable.$inferSelect) {
  let clientName: string | null = null;
  if (r.clientId) {
    const [c] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, r.clientId));
    clientName = c?.name ?? null;
  }
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    clientId: r.clientId,
    clientName,
    status: r.status,
    fileUrl: r.fileUrl,
    summary: r.summary,
    dateFrom: r.dateFrom,
    dateTo: r.dateTo,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reports", requireAuth, async (_req, res): Promise<void> => {
  const reports = await db.select().from(reportsTable).orderBy(reportsTable.createdAt);
  const serialized = await Promise.all(reports.map(serializeReport));
  res.json(ListReportsResponse.parse(serialized));
});

router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [report] = await db.insert(reportsTable).values({ ...parsed.data, status: "pending" }).returning();

  // Simulate async report generation
  setTimeout(async () => {
    await db.update(reportsTable)
      .set({ status: "ready", summary: `Report generated for ${parsed.data.title}. Analysis complete.` })
      .where(eq(reportsTable.id, report.id));
  }, 2000);

  res.status(201).json(CreateReportResponse.parse(await serializeReport(report)));
});

router.get("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(GetReportResponse.parse(await serializeReport(report)));
});

router.delete("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [report] = await db.delete(reportsTable).where(eq(reportsTable.id, params.data.id)).returning();
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(DeleteReportResponse.parse({ message: "Report deleted" }));
});

export default router;
