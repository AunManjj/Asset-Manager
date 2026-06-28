import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reportsTable, clientsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import { canViewAgencyData, isAdmin, isClient, requireAuthUser } from "../middlewares/rbac";
import {
  ListReportsResponse,
  GetReportResponse,
  GetReportParams,
  CreateReportBody,
  CreateReportResponse,
  DeleteReportParams,
  DeleteReportResponse,
} from "../validation";

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

function assertReportAccess(
  user: NonNullable<Awaited<ReturnType<typeof requireAuthUser>>>,
  reportClientId: number | null,
  res: Parameters<typeof requireAuthUser>[1],
): boolean {
  if (isAdmin(user)) return true;
  if (isClient(user) && user.clientId && reportClientId === user.clientId) return true;
  res.status(403).json({ error: "Forbidden" });
  return false;
}

router.get("/reports", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const reports =
    isClient(user) && user.clientId
      ? await db.select().from(reportsTable).where(eq(reportsTable.clientId, user.clientId)).orderBy(reportsTable.createdAt)
      : await db.select().from(reportsTable).orderBy(reportsTable.createdAt);

  const serialized = await Promise.all(reports.map(serializeReport));
  res.json(ListReportsResponse.parse(serialized));
});

router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (isClient(user) && parsed.data.clientId !== user.clientId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!isAdmin(user) && !isClient(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [report] = await db.insert(reportsTable).values({ ...parsed.data, status: "pending" }).returning();

  setTimeout(async () => {
    await db.update(reportsTable)
      .set({ status: "ready", summary: `Report generated for ${parsed.data.title}. Analysis complete.` })
      .where(eq(reportsTable.id, report.id));
  }, 2000);

  res.status(201).json(CreateReportResponse.parse(await serializeReport(report)));
});

router.get("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !canViewAgencyData(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

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
  if (!assertReportAccess(user, report.clientId, res)) return;
  res.json(GetReportResponse.parse(await serializeReport(report)));
});

router.delete("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user || !isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

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
