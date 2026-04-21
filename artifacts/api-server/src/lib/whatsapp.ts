import { logger } from "./logger";

let twilioClientPromise: Promise<unknown> | null = null;

function loadTwilioClient(): Promise<unknown> | null {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  if (!twilioClientPromise) {
    twilioClientPromise = import("twilio")
      .then((mod) => {
        const Twilio = (mod as unknown as { default: (s: string, t: string) => unknown }).default;
        return Twilio(sid, token);
      })
      .catch((err) => {
        logger.error({ err }, "Failed to load twilio package");
        twilioClientPromise = null;
        throw err;
      });
  }
  return twilioClientPromise;
}

function formatToWhatsApp(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  // Indian numbers stored as 10 digits — prefix with +91
  const e164 = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  return `whatsapp:${e164}`;
}

export interface SendWhatsAppArgs {
  toPhone: string;
  body: string;
}

export interface SendWhatsAppResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  sid?: string;
}

export async function sendWhatsApp({ toPhone, body }: SendWhatsAppArgs): Promise<SendWhatsAppResult> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const clientPromise = loadTwilioClient();

  if (!clientPromise || !from) {
    logger.warn(
      { toPhone, body },
      "[whatsapp] Twilio not configured — would send (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM).",
    );
    return { ok: false, skipped: true, error: "Twilio not configured" };
  }

  try {
    const client = (await clientPromise) as {
      messages: {
        create: (args: { from: string; to: string; body: string }) => Promise<{ sid: string }>;
      };
    };
    const to = formatToWhatsApp(toPhone);
    const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
    const message = await client.messages.create({ from: fromAddr, to, body });
    logger.info({ sid: message.sid, to }, "[whatsapp] sent");
    return { ok: true, sid: message.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ err, toPhone }, "[whatsapp] send failed");
    return { ok: false, error };
  }
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM,
  );
}
