import { Link, useLocation } from "wouter";
import { Home, Search, UserPlus, Settings, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { Wordmark } from "./Logo";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/patients/new", label: "Add", icon: UserPlus },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const initials =
    (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") ||
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "D";

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/">
            <a className="hover-elevate rounded-md px-1 py-1">
              <Wordmark />
            </a>
          </Link>
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {navItems.map((item) => {
                const active =
                  item.to === "/"
                    ? location === "/"
                    : location.startsWith(item.to);
                return (
                  <Link key={item.to} href={item.to}>
                    <a
                      className={`hover-elevate active-elevate-2 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                        active
                          ? "text-primary bg-secondary"
                          : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {initials.slice(0, 2)}
              </div>
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="hover-elevate active-elevate-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 pb-28 md:pb-12">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="mx-auto max-w-5xl grid grid-cols-4">
          {navItems.map((item) => {
            const active =
              item.to === "/"
                ? location === "/"
                : location.startsWith(item.to);
            return (
              <Link key={item.to} href={item.to}>
                <a
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[60px] hover-elevate active-elevate-2 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
