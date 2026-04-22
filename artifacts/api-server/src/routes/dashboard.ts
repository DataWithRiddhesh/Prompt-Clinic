import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  patientsTable,
  visitsTable,
  appointmentsTable,
  medicineRemindersTable,
} from "@workspace/db/schema";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { requireDoctor, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard", requireDoctor, async (req, res) => {
  const { doctorId } = req as AuthedRequest;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [todayVisitsRows, todayAptRows, activeRemRows, monthPatRows] =
    await Promise.all([
      db
        .select({
          id: visitsTable.id,
          patientId: visitsTable.patientId,
          visitDate: visitsTable.visitDate,
          name: patientsTable.name,
        })
        .from(visitsTable)
        .innerJoin(patientsTable, eq(patientsTable.id, visitsTable.patientId))
        .where(
          and(
            eq(visitsTable.doctorId, doctorId),
            gte(visitsTable.visitDate, dayStart),
          ),
        )
        .orderBy(asc(visitsTable.visitDate)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.doctorId, doctorId),
            eq(appointmentsTable.appointmentDate, today),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(medicineRemindersTable)
        .where(
          and(
            eq(medicineRemindersTable.doctorId, doctorId),
            eq(medicineRemindersTable.isActive, true),
            gte(medicineRemindersTable.endDate, today),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patientsTable)
        .where(
          and(
            eq(patientsTable.doctorId, doctorId),
            gte(patientsTable.createdAt, monthStart),
          ),
        ),
    ]);

  const patientIds = Array.from(new Set(todayVisitsRows.map((v) => v.patientId)));
  const upcomingApts = patientIds.length
    ? await db
        .select()
        .from(appointmentsTable)
        .where(
          and(
            eq(appointmentsTable.doctorId, doctorId),
            gte(appointmentsTable.appointmentDate, today),
            sql`${appointmentsTable.patientId} = ANY(${patientIds})`,
          ),
        )
        .orderBy(asc(appointmentsTable.appointmentDate))
    : [];
  const aptByPat = new Map<string, { date: string; time: string | null }>();
  for (const a of upcomingApts) {
    if (!aptByPat.has(a.patientId)) {
      aptByPat.set(a.patientId, { date: a.appointmentDate, time: a.appointmentTime });
    }
  }

  const activeRems = patientIds.length
    ? await db
        .select({ patientId: medicineRemindersTable.patientId })
        .from(medicineRemindersTable)
        .where(
          and(
            eq(medicineRemindersTable.doctorId, doctorId),
            eq(medicineRemindersTable.isActive, true),
            gte(medicineRemindersTable.endDate, today),
            sql`${medicineRemindersTable.patientId} = ANY(${patientIds})`,
          ),
        )
    : [];
  const remSet = new Set(activeRems.map((r) => r.patientId));

  const todayPatientList = todayVisitsRows.map((v) => ({
    patientId: v.patientId,
    name: v.name,
    visitTime: v.visitDate.toISOString(),
    nextAppointmentDate: aptByPat.get(v.patientId)?.date ?? null,
    nextAppointmentTime: aptByPat.get(v.patientId)?.time ?? null,
    hasActiveReminder: remSet.has(v.patientId),
  }));

  res.json({
    todayPatients: patientIds.length,
    todayAppointments: todayAptRows[0]?.count ?? 0,
    activeReminders: activeRemRows[0]?.count ?? 0,
    patientsThisMonth: monthPatRows[0]?.count ?? 0,
    todayPatientList,
  });
});

export default router;
