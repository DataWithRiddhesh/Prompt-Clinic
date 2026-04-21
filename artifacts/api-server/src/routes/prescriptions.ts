import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { prescriptionsTable, patientsTable } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreatePrescriptionBody } from "@workspace/api-zod";
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

router.get("/patients/:patientId/prescriptions", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;
  if (!(await ensureOwn(doctorId, patientId))) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const rows = await db
    .select()
    .from(prescriptionsTable)
    .where(eq(prescriptionsTable.patientId, patientId))
    .orderBy(desc(prescriptionsTable.createdAt));
  res.json(
    rows.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      photoUrl: r.photoUrl,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/patients/:patientId/prescriptions", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;
  if (!(await ensureOwn(doctorId, patientId))) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const parsed = CreatePrescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid prescription" });
    return;
  }
  const id = randomUUID();
  const inserted = await db
    .insert(prescriptionsTable)
    .values({
      id,
      patientId,
      doctorId,
      photoUrl: parsed.data.photoUrl,
    })
    .returning();
  const r = inserted[0]!;
  res.json({
    id: r.id,
    patientId: r.patientId,
    photoUrl: r.photoUrl,
    createdAt: r.createdAt.toISOString(),
  });
});

export default router;
