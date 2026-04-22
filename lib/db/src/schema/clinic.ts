import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";

export const doctorsTable = pgTable("doctors", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull().default(""),
  clinicName: text("clinic_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const patientsTable = pgTable(
  "patients",
  {
    id: text("id").primaryKey(),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctorsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    age: integer("age").notNull(),
    gender: text("gender").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("patients_doctor_idx").on(t.doctorId),
    index("patients_name_idx").on(t.name),
    index("patients_phone_idx").on(t.phone),
  ],
);

export const visitsTable = pgTable(
  "visits",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patientsTable.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctorsTable.id, { onDelete: "cascade" }),
    visitDate: timestamp("visit_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("visits_patient_idx").on(t.patientId),
    index("visits_doctor_idx").on(t.doctorId),
    index("visits_date_idx").on(t.visitDate),
  ],
);

export const appointmentsTable = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patientsTable.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctorsTable.id, { onDelete: "cascade" }),
    appointmentDate: date("appointment_date").notNull(),
    appointmentTime: text("appointment_time"),
    reminderSent: boolean("reminder_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("appointments_patient_idx").on(t.patientId),
    index("appointments_doctor_idx").on(t.doctorId),
    index("appointments_date_idx").on(t.appointmentDate),
  ],
);

export const prescriptionsTable = pgTable(
  "prescriptions",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patientsTable.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctorsTable.id, { onDelete: "cascade" }),
    photoUrl: text("photo_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prescriptions_patient_idx").on(t.patientId),
    index("prescriptions_doctor_idx").on(t.doctorId),
  ],
);

export const medicineRemindersTable = pgTable(
  "medicine_reminders",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patientsTable.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => doctorsTable.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    durationDays: integer("duration_days").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastReminderSentDate: date("last_reminder_sent_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reminders_patient_idx").on(t.patientId),
    index("reminders_doctor_idx").on(t.doctorId),
  ],
);
