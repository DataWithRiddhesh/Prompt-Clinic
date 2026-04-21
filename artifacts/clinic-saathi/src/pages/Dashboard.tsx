import { Link, useLocation } from "wouter";
import { useGetDashboard, useGetMe } from "@workspace/api-client-react";
import { Calendar, FileImage, Pill, Users, ArrowRight, ChevronRight, UserPlus } from "lucide-react";

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-card-border p-4 shadow-sm">
      <div className={`h-9 w-9 rounded-lg grid place-items-center ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2.5 text-2xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: me } = useGetMe();
  const { data: dashboard, isLoading } = useGetDashboard();
  const [, setLocation] = useLocation();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground p-5 sm:p-7 shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80 font-semibold">{today}</div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
              {greeting}{me?.name ? `, Dr. ${me.name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-1 text-sm opacity-90 max-w-md">
              Here's how your clinic looks today.
            </p>
          </div>
          <button
            onClick={() => setLocation("/patients/new")}
            className="hidden sm:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 transition px-3.5 py-2.5 rounded-lg text-sm font-semibold backdrop-blur-sm border border-white/20"
          >
            <UserPlus className="h-4 w-4" />
            Add patient
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="Today's patients" value={dashboard?.todayPatients ?? "—"} tone="bg-primary/10 text-primary" />
        <Stat icon={Calendar} label="Today's appointments" value={dashboard?.todayAppointments ?? "—"} tone="bg-accent/15 text-accent" />
        <Stat icon={Pill} label="Active reminders" value={dashboard?.activeReminders ?? "—"} tone="bg-chart-3/15 text-chart-3" />
        <Stat icon={FileImage} label="New this month" value={dashboard?.patientsThisMonth ?? "—"} tone="bg-chart-4/15 text-chart-4" />
      </div>

      {/* Mobile add patient */}
      <Link href="/patients/new">
        <a className="sm:hidden flex items-center justify-between rounded-2xl bg-foreground text-background px-5 py-4 font-semibold shadow-md hover-elevate active-elevate-2">
          <span className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-background/15 grid place-items-center">
              <UserPlus className="h-4 w-4" />
            </span>
            Add a new patient
          </span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </Link>

      {/* Today's queue */}
      <section className="rounded-2xl bg-card border border-card-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base">Today's queue</h2>
            <p className="text-xs text-muted-foreground">Patients you've seen today</p>
          </div>
          <Link href="/search">
            <a className="text-xs font-semibold text-primary hover-elevate px-2 py-1 rounded">All patients</a>
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !dashboard || dashboard.todayPatientList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mb-3">
              <Users className="h-6 w-6" />
            </div>
            <div className="font-semibold">No patients yet today</div>
            <div className="text-sm text-muted-foreground mt-1">
              When you add a patient they will appear here.
            </div>
            <Link href="/patients/new">
              <a className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover-elevate active-elevate-2">
                <UserPlus className="h-4 w-4" /> Add your first patient today
              </a>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {dashboard.todayPatientList.map((p) => {
              const time = new Date(p.visitTime).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              });
              const initials = p.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li key={p.patientId}>
                  <Link href={`/patients/${p.patientId}`}>
                    <a className="flex items-center justify-between gap-3 px-5 py-3.5 hover-elevate active-elevate-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>Visited at {time}</span>
                            {p.nextAppointmentDate && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-medium">
                                  Next: {new Date(p.nextAppointmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.hasActiveReminder && (
                          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-chart-3/15 text-chart-3">
                            On meds
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
