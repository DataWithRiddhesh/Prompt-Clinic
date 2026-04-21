import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable,
  visitsTable,
  appointmentsTable,
  medicineRemindersTable,
} from "@workspace/db/schema";
import { and, desc, eq, ilike, or, sql, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { CreatePatientBody } from "@workspace/api-zod";
import { requireDoctor, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/patients", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const q = (req.query.q as string | undefined)?.trim();

  const where = q
    ? and(
        eq(patientsTable.doctorId, doctorId),
        or(
          ilike(patientsTable.name, `%${q}%`),
          ilike(patientsTable.phone, `%${q}%`),
        ),
      )
    : eq(patientsTable.doctorId, doctorId);

  const patients = await db
    .select()
    .from(patientsTable)
    .where(where)
    .orderBy(desc(patientsTable.createdAt))
    .limit(200);

  if (patients.length === 0) {
    res.json([]);
    return;
  }

  const ids = patients.map((p) => p.id);

  const visitAgg = await db
    .select({
      patientId: visitsTable.patientId,
      total: sql<number>`count(*)::int`,
      last: sql<string | null>`max(${visitsTable.visitDate})::text`,
    })
    .from(visitsTable)
    .where(
      and(
        eq(visitsTable.doctorId, doctorId),
        sql`${visitsTable.patientId} = ANY(${ids})`,
      ),
    )
    .groupBy(visitsTable.patientId);

  const visitMap = new Map(visitAgg.map((v) => [v.patientId, v]));

  const activeReminders = await db
    .select({ patientId: medicineRemindersTable.patientId })
    .from(medicineRemindersTable)
    .where(
      and(
        eq(medicineRemindersTable.doctorId, doctorId),
        eq(medicineRemindersTable.isActive, true),
        gte(medicineRemindersTable.endDate, todayIso()),
        sql`${medicineRemindersTable.patientId} = ANY(${ids})`,
      ),
    );
  const reminderSet = new Set(activeReminders.map((r) => r.patientId));

  res.json(
    patients.map((p) => {
      const v = visitMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
        createdAt: p.createdAt.toISOString(),
        totalVisits: v?.total ?? 0,
        lastVisitDate: v?.last ?? null,
        hasActiveReminder: reminderSet.has(p.id),
      };
    }),
  );
});

router.post("/patients", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid patient details" });
    return;
  }
  const id = randomUUID();
  const inserted = await db
    .insert(patientsTable)
    .values({
      id,
      doctorId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      age: parsed.data.age,
      gender: parsed.data.gender,
    })
    .returning();

  // Record an initial visit for today
  await db.insert(visitsTable).values({
    id: randomUUID(),
    patientId: id,
    doctorId,
  });

  const p = inserted[0]!;
  res.json({
    id: p.id,
    name: p.name,
    phone: p.phone,
    age: p.age,
    gender: p.gender,
    createdAt: p.createdAt.toISOString(),
  });
});

router.get("/patients/:patientId", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const { patientId } = req.params;

  const rows = await db
    .select()
    .from(patientsTable)
    .where(
      and(eq(patientsTable.id, patientId), eq(patientsTable.doctorId, doctorId)),
    )
    .limit(1);
  const p = rows[0];
  if (!p) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const visits = await db
    .select({
      total: sql<number>`count(*)::int`,
      last: sql<string | null>`max(${visitsTable.visitDate})::text`,
    })
    .from(visitsTable)
    .where(eq(visitsTable.patientId, patientId));
  const totalVisits = visits[0]?.total ?? 0;
  const lastVisitDate = visits[0]?.last ?? null;

  const today = todayIso();
  const nextApt = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.patientId, patientId),
        gte(appointmentsTable.appointmentDate, today),
      ),
    )
    .orderBy(appointmentsTable.appointmentDate)
    .limit(1);

  const reminder = await db
    .select()
    .from(medicineRemindersTable)
    .where(
      and(
        eq(medicineRemindersTable.patientId, patientId),
        eq(medicineRemindersTable.isActive, true),
        gte(medicineRemindersTable.endDate, today),
      ),
    )
    .orderBy(desc(medicineRemindersTable.createdAt))
    .limit(1);

  res.json({
    patient: {
      id: p.id,
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      createdAt: p.createdAt.toISOString(),
    },
    totalVisits,
    lastVisitDate,
    nextAppointment: nextApt[0]
      ? {
          id: nextApt[0].id,
          patientId: nextApt[0].patientId,
          appointmentDate: nextApt[0].appointmentDate,
          createdAt: nextApt[0].createdAt.toISOString(),
        }
      : null,
    activeReminder: reminder[0]
      ? {
          id: reminder[0].id,
          patientId: reminder[0].patientId,
          startDate: reminder[0].startDate,
          endDate: reminder[0].endDate,
          durationDays: reminder[0].durationDays,
          isActive: reminder[0].isActive,
          createdAt: reminder[0].createdAt.toISOString(),
        }
      : null,
  });
});

export default router;
