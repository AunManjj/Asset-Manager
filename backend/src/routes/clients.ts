import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, clientsTable } from "../db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { isAdmin, isClient, requireAuthUser } from "../middlewares/rbac";
import {
  ListClientsResponse,
  GetClientResponse,
  GetClientParams,
  CreateClientBody,
  UpdateClientBody,
  UpdateClientParams,
  DeleteClientParams,
  DeleteClientResponse,
} from "../validation";

const router: IRouter = Router();

function serializeClient(c: typeof clientsTable.$inferSelect, includeSecrets: boolean) {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    contactName: c.contactName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    logoUrl: c.logoUrl,
    status: c.status,
    monthlyBudget: c.monthlyBudget != null ? Number(c.monthlyBudget) : null,
    metaAdAccountId: c.metaAdAccountId,
    ...(includeSecrets ? { metaAccessToken: c.metaAccessToken } : {}),
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/clients", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user) return;

  if (isAdmin(user)) {
    const clients = await db.select().from(clientsTable).orderBy(clientsTable.createdAt);
    res.json(ListClientsResponse.parse(clients.map((c) => serializeClient(c, true))));
    return;
  }

  if (isClient(user) && user.clientId) {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, user.clientId));
    res.json(ListClientsResponse.parse(client ? [serializeClient(client, false)] : []));
    return;
  }

  res.status(403).json({ error: "Forbidden" });
});

router.post("/clients", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(GetClientResponse.parse(serializeClient(client, true)));
});

router.get("/clients/:id", requireAuth, async (req, res): Promise<void> => {
  const user = await requireAuthUser(req, res);
  if (!user) return;

  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  if (isClient(user) && user.clientId !== params.data.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!isAdmin(user) && !isClient(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(GetClientResponse.parse(serializeClient(client, isAdmin(user))));
});

router.patch("/clients/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.update(clientsTable).set(parsed.data).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(GetClientResponse.parse(serializeClient(client, true)));
});

router.delete("/clients/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [client] = await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(DeleteClientResponse.parse({ message: "Client deleted" }));
});

export default router;
