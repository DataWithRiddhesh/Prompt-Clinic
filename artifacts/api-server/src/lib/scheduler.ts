import { db } from "@workspace/db";
import {
  appointmentsTable,
  doctorsTable,
  medicineRemindersTable,
  patientsTable,
} from "@workspace/db/schema";
import { and, eq, gte, lte, or, isNull } from "drizzle-orm";
import { logger } from "./logger";
import { sendWhatsApp, isWhatsAppConfigured } from "./whatsapp";

const TICK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SEND_HOUR_IST = 9; // 9 AM IST

// India is UTC+5:30 — compute current hour & date in IST without depending on TZ env.
function nowInIst(): { date: string; hour: number } {
  const now = new Date();
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(istMs);
  const yyyy = ist.getUTCFullYear();
  const mm = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(ist.getUTCDate()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, hour: ist.getUTCHours() };
}

function tomorrowIst(): string {
  const { date } = nowInIst();
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function fmtDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function sendAppointmentReminders(): Promise<void> {
  const target = tomorrowIst();
  const rows = await db
    .select({
      apt: appointmentsTable,
      patient: patientsTable,
      doctor: doctorsTable,
    })
    .from(appointmentsTable)
    .innerJoin(patientsTable, eq(patientsTable.id, appointmentsTable.patientId))
    .innerJoin(doctorsTable, eq(doctorsTable.id, appointmentsTable.doctorId))
    .where(
      and(
        eq(appointmentsTable.appointmentDate, target),
        eq(appointmentsTable.reminderSent, false),
      ),
    );

  if (rows.length === 0) return;
  logger.info({ count: rows.length, target }, "[scheduler] sending appointment reminders");

  for (const row of rows) {
    const docName = row.doctor.name?.trim() || "your doctor";
    const clinic = row.doctor.clinicName?.trim();
    const timePart = row.apt.appointmentTime
      ? ` at ${row.apt.appointmentTime}`
      : "";
    const clinicPart = clinic ? ` at ${clinic}` : "";
    const body =
      `Hello ${row.patient.name}, this is a reminder of your appointment with Dr. ${docName}${clinicPart} ` +
      `tomorrow (${fmtDateLong(target)})${timePart}. ` +
      `Please reply if you cannot make it. — MediSync`;

    const result = await sendWhatsApp({ toPhone: row.patient.phone, body });
    if (result.ok) {
      await db
        .update(appointmentsTable)
        .set({ reminderSent: true })
        .where(eq(appointmentsTable.id, row.apt.id));
    }
  }
}

async function sendMedicineReminders(): Promise<void> {
  const { date: today } = nowInIst();
  const rows = await db
    .select({
      reminder: medicineRemindersTable,
      patient: patientsTable,
      doctor: doctorsTable,
    })
    .from(medicineRemindersTable)
    .innerJoin(patientsTable, eq(patientsTable.id, medicineRemindersTable.patientId))
    .innerJoin(doctorsTable, eq(doctorsTable.id, medicineRemindersTable.doctorId))
    .where(
      and(
        eq(medicineRemindersTable.isActive, true),
        lte(medicineRemindersTable.startDate, today),
        gte(medicineRemindersTable.endDate, today),
        or(
          isNull(medicineRemindersTable.lastReminderSentDate),
          lte(medicineRemindersTable.lastReminderSentDate, today),
        ),
      ),
    );

  // Filter out ones already sent today (lte includes today)
  const due = rows.filter(
    (r) => r.reminder.lastReminderSentDate !== today,
  );

  if (due.length === 0) return;
  logger.info({ count: due.length, today }, "[scheduler] sending medicine reminders");

  for (const row of due) {
    const end = new Date(row.reminder.endDate + "T00:00:00Z");
    const now = new Date(today + "T00:00:00Z");
    const daysLeft = Math.max(
      0,
      Math.round((end.getTime() - now.getTime()) / 86_400_000),
    );
    const docName = row.doctor.name?.trim() || "your doctor";
    const tail =
      daysLeft === 0
        ? "Today is the last day of your course."
        : `Course ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
    const body =
      `Hi ${row.patient.name}, this is your daily medicine reminder from Dr. ${docName}. ${tail} — MediSync`;

    const result = await sendWhatsApp({ toPhone: row.patient.phone, body });
    if (result.ok) {
      await db
        .update(medicineRemindersTable)
        .set({ lastReminderSentDate: today })
        .where(eq(medicineRemindersTable.id, row.reminder.id));
    }
  }
}

async function tick(): Promise<void> {
  const { hour } = nowInIst();
  if (hour < SEND_HOUR_IST) return;
  try {
    await sendAppointmentReminders();
    await sendMedicineReminders();
  } catch (err) {
    logger.error({ err }, "[scheduler] tick failed");
  }
}

let interval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  if (interval) return;
  if (!isWhatsAppConfigured()) {
    logger.warn(
      "[scheduler] starting in dry-run mode (Twilio env vars missing). Reminders will be logged but not sent.",
    );
  } else {
    logger.info("[scheduler] WhatsApp reminders enabled.");
  }
  // Run shortly after startup, then every 5 minutes.
  setTimeout(() => {
    void tick();
  }, 10_000);
  interval = setInterval(() => {
    void tick();
  }, TICK_INTERVAL_MS);
}

// Manual trigger used by debug route (?force=1 ignores hour gate).
export async function runRemindersNow(force: boolean = true): Promise<{
  ranAppointments: boolean;
  ranMedicines: boolean;
}> {
  if (!force) {
    const { hour } = nowInIst();
    if (hour < SEND_HOUR_IST) {
      return { ranAppointments: false, ranMedicines: false };
    }
  }
  await sendAppointmentReminders();
  await sendMedicineReminders();
  return { ranAppointments: true, ranMedicines: true };
}
