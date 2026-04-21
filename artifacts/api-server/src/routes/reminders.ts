import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { medicineRemindersTable, patientsTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreateReminderBody } from "@workspace/api-zod";
import { requireDoctor, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

async function ensureOwn(doctorId: string, patientId: string): Promise<boolean> {
  const rows = await db
    .select({ id: patientsTable.id })
    .from(patientsTable)
    .where(and(eq(patientsTable.id, patientId), eq(patientsTable.doctorId, doctorId)))
    .limit(1);
  return rows.length > 0;
}

function serialize(r: typeof medicineRemindersTable.$inferSelect) {
  return {
    id: r.id,
    patientId: r.patientId,
    medicineName: r.medicineName,
    startDate: r.startDate,
    endDate: r.endDate,
    durationDays: r.durationDays,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/patients/:patientId/reminders", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;
  if (!(await ensureOwn(doctorId, patientId))) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const rows = await db
    .select()
    .from(medicineRemindersTable)
    .where(eq(medicineRemindersTable.patientId, patientId))
    .orderBy(desc(medicineRemindersTable.createdAt));
  res.json(rows.map(serialize));
});

router.post("/patients/:patientId/reminders", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;
  if (!(await ensureOwn(doctorId, patientId))) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reminder" });
    return;
  }

  await db
    .update(medicineRemindersTable)
    .set({ isActive: false })
    .where(
      and(
        eq(medicineRemindersTable.patientId, patientId),
        eq(medicineRemindersTable.isActive, true),
      ),
    );

  const start = new Date();
  const startIso = start.toISOString().slice(0, 10);
  const end = new Date(start);
  end.setDate(end.getDate() + parsed.data.durationDays - 1);
  const endIso = end.toISOString().slice(0, 10);

  const id = randomUUID();
  const inserted = await db
    .insert(medicineRemindersTable)
    .values({
      id,
      patientId,
      doctorId,
      medicineName: parsed.data.medicineName.trim(),
      startDate: startIso,
      endDate: endIso,
      durationDays: parsed.data.durationDays,
      isActive: parsed.data.isActive,
    })
    .returning();
  res.json(serialize(inserted[0]!));
});

export default router;
