import { useState } from "react";
import { Link } from "wouter";
import { useListPatients } from "@workspace/api-client-react";
import { Search as SearchIcon, ChevronRight, Phone, Loader2, UserPlus } from "lucide-react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const { data: patients, isLoading } = useListPatients(
    q.trim() ? { q: q.trim() } : undefined,
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find a patient</h1>
        <p className="text-sm text-muted-foreground mt-1">Search by name or phone number.</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a name or phone…"
          className="w-full h-13 min-h-[52px] rounded-xl border border-input bg-card pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-ring focus:border-ring shadow-sm"
          autoFocus
        />
      </div>

      <div className="rounded-2xl bg-card border border-card-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 grid place-items-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !patients?.length ? (
          <div className="p-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mb-3">
              <SearchIcon className="h-6 w-6" />
            </div>
            <div className="font-semibold">
              {q ? "No matching patients" : "Your patients will appear here"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {q ? "Try a different name or number." : "Add your first patient to get started."}
            </div>
            {!q && (
              <Link href="/patients/new">
                <a className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover-elevate active-elevate-2">
                  <UserPlus className="h-4 w-4" /> Add a patient
                </a>
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {patients?.map((p) => {
              const initials = p.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li key={p.id}>
                  <Link href={`/patients/${p.id}`}>
                    <a className="flex items-center justify-between gap-3 px-4 py-3.5 hover-elevate active-elevate-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {p.phone}
                            </span>
                            <span>{p.age}y · {p.gender}</span>
                            <span className="hidden sm:inline">{p.totalVisits} visit{p.totalVisits === 1 ? "" : "s"}</span>
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
      </div>
    </div>
  );
}
