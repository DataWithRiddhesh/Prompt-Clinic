import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, patientsTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreateAppointmentBody } from "@workspace/api-zod";
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

function serialize(r: typeof appointmentsTable.$inferSelect) {
  return {
    id: r.id,
    patientId: r.patientId,
    appointmentDate: r.appointmentDate,
    appointmentTime: r.appointmentTime,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/patients/:patientId/appointments", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;
  if (!(await ensureOwn(doctorId, patientId))) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.patientId, patientId))
    .orderBy(desc(appointmentsTable.appointmentDate));
  res.json(rows.map(serialize));
});

router.post("/patients/:patientId/appointments", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;
  if (!(await ensureOwn(doctorId, patientId))) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid appointment" });
    return;
  }
  const id = randomUUID();
  const inserted = await db
    .insert(appointmentsTable)
    .values({
      id,
      patientId,
      doctorId,
      appointmentDate: parsed.data.appointmentDate,
      appointmentTime: parsed.data.appointmentTime ?? null,
    })
    .returning();
  res.json(serialize(inserted[0]!));
});

router.delete("/appointments/:appointmentId", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { appointmentId } = req.params;
  const result = await db
    .delete(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.id, appointmentId),
        eq(appointmentsTable.doctorId, doctorId),
      ),
    )
    .returning({ id: appointmentsTable.id });
  if (result.length === 0) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
