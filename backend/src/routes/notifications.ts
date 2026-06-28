import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "../db";
import { requireAuth } from "../middlewares/auth";
import {
  ListNotificationsResponse,
  MarkNotificationReadResponse,
  MarkNotificationReadParams,
  MarkAllNotificationsReadResponse,
} from "../validation";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function serializeNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", requireAuth, async (_req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable).orderBy(sql`${notificationsTable.createdAt} desc`);
  res.json(ListNotificationsResponse.parse(notifications.map(serializeNotification)));
});

router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notification] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, params.data.id)).returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(serializeNotification(notification)));
});

router.post("/notifications/read-all", requireAuth, async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true });
  res.json(MarkAllNotificationsReadResponse.parse({ message: "All notifications marked as read" }));
});

export default router;
