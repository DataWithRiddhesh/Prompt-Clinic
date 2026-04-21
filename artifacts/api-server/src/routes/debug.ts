import { Router, type IRouter } from "express";
import { runRemindersNow } from "../lib/scheduler";
import { isWhatsAppConfigured } from "../lib/whatsapp";
import { requireDoctor } from "../lib/auth";

const router: IRouter = Router();

router.post("/admin/run-reminders-now", requireDoctor, async (_req, res) => {
  const result = await runRemindersNow(true);
  res.json({ ...result, whatsappConfigured: isWhatsAppConfigured() });
});

export default router;
