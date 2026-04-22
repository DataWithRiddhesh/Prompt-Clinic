import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPatient,
  useListPatientPrescriptions,
  useListPatientReminders,
  useCreateAppointment,
  useCancelAppointment,
  useCreatePrescription,
  useCreateReminder,
  getGetPatientQueryKey,
  getGetDashboardQueryKey,
  getListPatientPrescriptionsQueryKey,
  getListPatientRemindersQueryKey,
  getListPatientAppointmentsQueryKey,
} from "@workspace/api-client-react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Loader2, Phone, Pill, Camera, X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { basePath, objectImageUrl } from "@/lib/api";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function plannedMessageCount(duration: number): number {
  if (duration < 3) return 0;
  if (duration <= 4) return 1;
  if (duration <= 10) return 2;
  if (duration <= 20) return 4;
  return 7;
}

function fmtDate(s: string): string {
  return new Date(s + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: detail, isLoading } = useGetPatient(patientId, {
    query: { enabled: !!patientId, queryKey: getGetPatientQueryKey(patientId) },
  });
  const { data: prescriptions } = useListPatientPrescriptions(patientId, {
    query: { enabled: !!patientId, queryKey: getListPatientPrescriptionsQueryKey(patientId) },
  });
  const { data: reminders } = useListPatientReminders(patientId, {
    query: { enabled: !!patientId, queryKey: getListPatientRemindersQueryKey(patientId) },
  });

  const createApt = useCreateAppointment();
  const cancelApt = useCancelAppointment();
  const createPresc = useCreatePrescription();
  const createReminder = useCreateReminder();

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Reminder state
  const [duration, setDuration] = useState(7);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [aptTime, setAptTime] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const activeReminder = detail?.activeReminder;
  useEffect(() => {
    if (activeReminder) {
      setDuration(activeReminder.durationDays);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReminder?.id]);
  useEffect(() => {
    if (detail?.nextAppointment?.appointmentTime && !aptTime) {
      setAptTime(detail.nextAppointment.appointmentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.nextAppointment?.id]);
  const reminderStart = useMemo(() => isoDate(new Date()), []);
  const reminderEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + duration - 1);
    return isoDate(d);
  }, [duration]);

  function invalidatePatient() {
    queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPatientAppointmentsQueryKey(patientId) });
  }

  function bookDate(d: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return;
    const dateStr = isoDate(d);
    createApt.mutate(
      { patientId, data: { appointmentDate: dateStr, appointmentTime: aptTime || null } },
      {
        onSuccess: () => {
          invalidatePatient();
          toast({ title: "Appointment saved", description: `Next visit on ${fmtDate(dateStr)}.` });
        },
        onError: () =>
          toast({ title: "Could not save", description: "Please try again.", variant: "destructive" }),
      },
    );
  }

  function cancel() {
    if (!detail?.nextAppointment) return;
    cancelApt.mutate(
      { appointmentId: detail.nextAppointment.id },
      {
        onSuccess: () => {
          invalidatePatient();
          toast({ title: "Appointment cancelled" });
        },
        onError: () =>
          toast({ title: "Could not cancel", description: "Please try again.", variant: "destructive" }),
      },
    );
  }

  function saveReminder() {
    createReminder.mutate(
      {
        patientId,
        data: {
          durationDays: duration,
          isActive: reminderEnabled,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPatientRemindersQueryKey(patientId) });
          invalidatePatient();
          toast({
            title: reminderEnabled ? "Reminder started" : "Reminder saved (off)",
            description: reminderEnabled
              ? `Course runs until ${fmtDate(reminderEnd)}.`
              : "You can turn it on anytime.",
          });
        },
        onError: () =>
          toast({ title: "Could not save reminder", description: "Please try again.", variant: "destructive" }),
      },
    );
  }

  if (isLoading || !detail) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const p = detail.patient;
  const initials = p.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const lastVisit = detail.lastVisitDate
    ? new Date(detail.lastVisitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  // Build calendar grid for calMonth
  const monthStart = calMonth;
  const startWeekday = monthStart.getDay();
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = isoDate(new Date());
  const aptKey = detail.nextAppointment?.appointmentDate;

  return (
    <div className="space-y-6">
      <Link href="/">
        <a className="hover-elevate active-elevate-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground px-2 py-1 rounded-md">
          <ArrowLeft className="h-4 w-4" /> Home
        </a>
      </Link>

      {/* Patient card */}
      <section className="rounded-2xl bg-gradient-to-br from-card to-secondary/40 border border-card-border shadow-sm p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-xl font-bold shadow-md shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">{p.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{p.age}y · {p.gender}</span>
              <a href={`tel:+91${p.phone}`} className="hover-elevate inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-foreground font-medium">
                <Phone className="h-3 w-3" /> +91 {p.phone}
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                {detail.totalVisits} visit{detail.totalVisits === 1 ? "" : "s"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                Last visit: {lastVisit}
              </span>
              {activeReminder && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-chart-3/15 text-chart-3 font-semibold inline-flex items-center gap-1">
                  <Pill className="h-3 w-3" /> On medicines
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Next appointment */}
      <section className="rounded-2xl bg-card border border-card-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/15 text-accent grid place-items-center">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold">Next appointment</h2>
              <p className="text-xs text-muted-foreground">Pick a time, then tap a date.</p>
            </div>
          </div>
          {detail.nextAppointment && (
            <button
              onClick={cancel}
              disabled={cancelApt.isPending}
              className="hover-elevate active-elevate-2 inline-flex items-center gap-1.5 text-sm text-destructive font-semibold px-2.5 py-1.5 rounded-md disabled:opacity-60"
            >
              {cancelApt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel
            </button>
          )}
        </div>

        {detail.nextAppointment && (
          <div className="px-5 py-3 bg-chart-3/10 border-b border-border text-sm font-semibold text-chart-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Currently scheduled for {fmtDate(detail.nextAppointment.appointmentDate)}
            {detail.nextAppointment.appointmentTime
              ? ` at ${detail.nextAppointment.appointmentTime}`
              : ""}
          </div>
        )}

        <div className="px-4 pt-4">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Time (optional, included in WhatsApp reminder)
          </label>
          <input
            type="time"
            value={aptTime}
            onChange={(e) => setAptTime(e.target.value)}
            className="w-full sm:w-44 h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring tabular-nums"
          />
        </div>

        <div className="p-4">
          {/* Calendar */}
          <div className="flex items-center justify-between px-1 mb-2">
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
              className="hover-elevate active-elevate-2 p-2 rounded-md"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-semibold">
              {calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
              className="hover-elevate active-elevate-2 p-2 rounded-md"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dayDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
              const key = isoDate(dayDate);
              const isPast = key < todayKey;
              const isToday = key === todayKey;
              const isApt = key === aptKey;
              return (
                <button
                  key={i}
                  onClick={() => bookDate(dayDate)}
                  disabled={isPast || createApt.isPending}
                  className={`aspect-square rounded-lg text-sm font-semibold transition relative
                    ${isApt ? "bg-chart-3 text-white shadow-md" : ""}
                    ${!isApt && isToday ? "border-2 border-primary text-primary" : ""}
                    ${!isApt && !isToday && !isPast ? "hover-elevate active-elevate-2 text-foreground" : ""}
                    ${isPast ? "text-muted-foreground/40 cursor-not-allowed" : ""}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prescriptions */}
      <section className="rounded-2xl bg-card border border-card-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold">Prescriptions</h2>
              <p className="text-xs text-muted-foreground">Photos of past prescriptions.</p>
            </div>
          </div>
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={10 * 1024 * 1024}
            onGetUploadParameters={async (file) => {
              const res = await fetch(`${basePath}/api/storage/uploads/request-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  name: file.name ?? "prescription",
                  size: file.size ?? 0,
                  contentType: file.type ?? "application/octet-stream",
                }),
              });
              if (!res.ok) throw new Error("Failed to get upload URL");
              const data = (await res.json()) as { uploadURL: string; objectPath: string };
              (file as unknown as { meta: Record<string, unknown> }).meta.objectPath = data.objectPath;
              return {
                method: "PUT" as const,
                url: data.uploadURL,
                headers: { "Content-Type": file.type ?? "application/octet-stream" },
              };
            }}
            onComplete={(result) => {
              const successful = result.successful?.[0];
              const objectPath = successful?.meta?.objectPath as string | undefined;
              if (!objectPath) {
                toast({ title: "Upload failed", variant: "destructive" });
                return;
              }
              createPresc.mutate(
                { patientId, data: { photoUrl: objectPath } },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries({
                      queryKey: getListPatientPrescriptionsQueryKey(patientId),
                    });
                    toast({ title: "Prescription saved" });
                  },
                  onError: () =>
                    toast({ title: "Could not save", variant: "destructive" }),
                },
              );
            }}
            buttonClassName="hover-elevate active-elevate-2 inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-md bg-primary text-primary-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Camera className="h-4 w-4" />
              Add photo
            </span>
          </ObjectUploader>
        </div>

        <div className="p-4">
          {!prescriptions || prescriptions.length === 0 ? (
            <div className="px-2 py-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mb-3">
                <Camera className="h-6 w-6" />
              </div>
              <div className="font-semibold">No prescriptions yet</div>
              <div className="text-sm text-muted-foreground mt-1">
                Tap "Add photo" to upload one from your phone.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {prescriptions.map((rx) => {
                const url = objectImageUrl(rx.photoUrl);
                return (
                  <button
                    key={rx.id}
                    onClick={() => setLightboxUrl(url)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-card-border bg-muted hover-elevate active-elevate-2"
                  >
                    <img src={url} alt="Prescription" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] font-medium">
                      {new Date(rx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Medicine reminder */}
      <section className="rounded-2xl bg-card border border-card-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-chart-3/15 text-chart-3 grid place-items-center">
              <Pill className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold">Medicine reminder</h2>
              <p className="text-xs text-muted-foreground">Track the patient's course.</p>
            </div>
          </div>
          {activeReminder ? (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-chart-3/15 text-chart-3">Active</span>
          ) : reminders && reminders.length > 0 ? (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-muted text-muted-foreground">Completed</span>
          ) : (
            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-muted text-muted-foreground">Not set</span>
          )}
        </div>

        <div className="p-5 space-y-4">
          {activeReminder && (
            <div className="rounded-xl bg-chart-3/10 border border-chart-3/30 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-chart-3">
                <Clock className="h-4 w-4" />
                {fmtDate(activeReminder.startDate)} → {fmtDate(activeReminder.endDate)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {activeReminder.durationDays} day{activeReminder.durationDays === 1 ? "" : "s"} total · daily WhatsApp at 9 AM
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Course duration (days)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={365}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                className="w-28 h-12 rounded-lg border border-input bg-background px-3.5 text-base tabular-nums outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              />
              <div className="flex gap-1.5">
                {[3, 5, 7, 10, 14].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDuration(n)}
                    className={`px-3 py-2 rounded-md text-sm font-semibold ${
                      duration === n ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover-elevate"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-xs space-y-1.5">
            <div className="font-semibold text-foreground text-sm">How many WhatsApps will go out?</div>
            <div className="text-muted-foreground leading-relaxed">
              Based on the course length, MediSync sends:
            </div>
            <ul className="text-muted-foreground space-y-0.5 pl-4 list-disc">
              <li><b>2–4 days</b> → 1 message in the middle</li>
              <li><b>5–10 days</b> → 2 messages</li>
              <li><b>11–20 days</b> → 4 messages</li>
              <li><b>21+ days</b> → 7 messages</li>
            </ul>
            <div className="text-muted-foreground pt-1">
              For this {duration}-day course: <b className="text-foreground">{plannedMessageCount(duration)} message{plannedMessageCount(duration) === 1 ? "" : "s"}</b>, never on day 1 or the last day.
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 border border-border px-4 py-3 cursor-pointer">
            <div>
              <div className="font-semibold text-sm">Send WhatsApp reminders</div>
              <div className="text-xs text-muted-foreground">Auto-spaced across the course at 9 AM IST.</div>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>

          <div className="flex items-center justify-between text-sm bg-secondary/40 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-muted-foreground">Starts</div>
              <div className="font-semibold">{fmtDate(reminderStart)}</div>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Ends</div>
              <div className="font-semibold">{fmtDate(reminderEnd)}</div>
            </div>
          </div>

          <button
            onClick={saveReminder}
            disabled={createReminder.isPending}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-md hover-elevate active-elevate-2 inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {createReminder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
            Save reminder
          </button>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/15 text-white grid place-items-center hover-elevate"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Prescription"
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
