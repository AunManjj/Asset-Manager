import { Router, type IRouter } from "express";
import { db, slackLogsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListSlackLogsResponse,
  SendSlackMessageBody,
  SendSlackMessageResponse,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function serializeLog(l: typeof slackLogsTable.$inferSelect) {
  return {
    id: l.id,
    channel: l.channel,
    message: l.message,
    status: l.status,
    triggeredBy: l.triggeredBy,
    errorMessage: l.errorMessage,
    createdAt: l.createdAt.toISOString(),
  };
}

router.get("/slack/logs", requireAuth, async (_req, res): Promise<void> => {
  const logs = await db.select().from(slackLogsTable).orderBy(sql`${slackLogsTable.createdAt} desc`);
  res.json(ListSlackLogsResponse.parse(logs.map(serializeLog)));
});

router.post("/slack/send", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendSlackMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let status = "sent";
  let errorMessage: string | null = null;

  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      const response = await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: parsed.data.channel,
          text: parsed.data.message,
        }),
      });
      if (!response.ok) {
        status = "failed";
        errorMessage = `Slack API returned ${response.status}`;
      }
    } catch (err: any) {
      status = "failed";
      errorMessage = err.message;
    }
  }

  const [log] = await db.insert(slackLogsTable).values({
    channel: parsed.data.channel,
    message: parsed.data.message,
    status,
    triggeredBy: "manual",
    errorMessage,
  }).returning();

  res.json(SendSlackMessageResponse.parse(serializeLog(log)));
});

export default router;
