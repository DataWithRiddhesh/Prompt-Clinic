import { SignInButton, SignUpButton } from "@clerk/react";
import { Calendar, FileImage, Pill, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/Logo";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background overflow-hidden">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Wordmark />
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <button className="hover-elevate active-elevate-2 px-3 py-2 rounded-md text-sm font-medium text-foreground">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hover-elevate active-elevate-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground">
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 pattern-dots opacity-60" />
          <div className="absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-40 -left-32 w-[420px] h-[420px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Built for the everyday Indian clinic
            </span>
            <h1 className="mt-5 text-[44px] sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Reminders That{" "}
              <span className="text-primary">Actually Reach Patients</span>.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Keep patient records, fix the next visit, save prescription photos
              and track medicine courses — all in a few taps between
              consultations. No clutter, no hospital-sized software.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <SignUpButton mode="modal">
                <button className="hover-elevate active-elevate-2 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-base font-semibold bg-primary text-primary-foreground shadow-md">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="hover-elevate active-elevate-2 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-base font-semibold bg-card text-foreground border border-border">
                  I already have an account
                </button>
              </SignInButton>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Works on any phone</div>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Your data stays private</div>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-chart-3" />Ready in 60 seconds</div>
            </div>
          </div>

          {/* Mock dashboard preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 rounded-3xl blur-xl" />
            <div className="relative rounded-3xl border border-card-border bg-card shadow-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Tuesday morning</div>
                  <div className="text-lg font-semibold">Good morning, doctor</div>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/15 text-primary font-bold grid place-items-center text-sm">RK</div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                {[
                  { label: "Today's patients", value: "12", icon: Users, tone: "bg-primary/10 text-primary" },
                  { label: "Appointments", value: "5", icon: Calendar, tone: "bg-accent/15 text-accent" },
                  { label: "On medicines", value: "8", icon: Pill, tone: "bg-chart-3/15 text-chart-3" },
                  { label: "New this month", value: "37", icon: FileImage, tone: "bg-chart-4/15 text-chart-4" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-card-border p-3">
                    <div className={`h-8 w-8 rounded-lg grid place-items-center ${s.tone}`}>
                      <s.icon className="h-4 w-4" />
                    </div>
                    <div className="mt-2 text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Today's queue</div>
                <div className="space-y-2">
                  {[
                    { n: "Anita Sharma", t: "9:10 AM", r: true },
                    { n: "Rohit Verma", t: "9:35 AM", r: false },
                    { n: "Lakshmi Iyer", t: "10:02 AM", r: true },
                  ].map((p) => (
                    <div key={p.n} className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground grid place-items-center text-xs font-bold">
                          {p.n.split(" ").map((s) => s[0]).join("")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{p.n}</div>
                          <div className="text-[11px] text-muted-foreground">{p.t}</div>
                        </div>
                      </div>
                      {p.r && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-chart-3/15 text-chart-3">On medicines</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything a busy doctor needs. Nothing more.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Designed for the 15 seconds between two patients. Fast on a
              cracked phone, quiet on a slow connection.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, title: "Patient records", desc: "Name, age, phone — added in 8 seconds." },
              { icon: Calendar, title: "Next appointments", desc: "Tap a date. The patient is on your calendar." },
              { icon: FileImage, title: "Prescription photos", desc: "Snap and store. Find any prescription in seconds." },
              { icon: Pill, title: "Medicine reminders", desc: "Track who is on a course and when it ends." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-card border border-card-border p-5 shadow-sm hover-elevate">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-semibold text-base">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Try it before your next patient walks in.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Sign up takes less than a minute. Add your first patient on the next screen.
        </p>
        <div className="mt-7 flex justify-center">
          <SignUpButton mode="modal">
            <button className="hover-elevate active-elevate-2 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-base font-semibold bg-primary text-primary-foreground shadow-md">
              Create your free account
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignUpButton>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <Wordmark />
          <div>© {new Date().getFullYear()} ClinicSaathi</div>
        </div>
      </footer>
    </div>
  );
}
