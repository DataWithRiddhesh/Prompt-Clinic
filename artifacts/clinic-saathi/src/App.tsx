import { useEffect, useRef } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useClerk,
} from "@clerk/react";
import {
  Switch,
  Route,
  Redirect,
  Router as WouterRouter,
  useLocation,
} from "wouter";
import {
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import { LogoMark } from "@/components/Logo";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import NewPatient from "@/pages/NewPatient";
import PatientDetail from "@/pages/PatientDetail";
import SearchPage from "@/pages/Search";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrlEnv = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const clerkProxyUrl = clerkProxyUrlEnv && clerkProxyUrlEnv.length > 0 ? clerkProxyUrlEnv : undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const PRIMARY_HEX = "#0EA5E9";

const clerkAppearance = {
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: PRIMARY_HEX,
    colorForeground: "#0F1F33",
    colorMutedForeground: "#5C6A7A",
    colorDanger: "#DC2626",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0F1F33",
    colorNeutral: "#1E293B",
    colorModalBackdrop: "rgba(15, 31, 51, 0.55)",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-[#E6E0D6]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none px-2",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#0F1F33] font-bold text-2xl",
    headerSubtitle: "text-[#5C6A7A] text-sm",
    socialButtonsBlockButton:
      "border border-[#E2E8F0] !bg-white text-[#0F1F33] font-medium rounded-lg",
    socialButtonsBlockButtonText: "text-[#0F1F33] font-medium",
    formFieldLabel: "text-[#0F1F33] font-semibold text-sm",
    formFieldInput:
      "rounded-lg border border-[#CBD5E1] bg-white text-[#0F1F33] focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20",
    formButtonPrimary:
      "!bg-[#0EA5E9] hover:!bg-[#0284C7] text-white font-semibold rounded-lg shadow-sm",
    footerAction: "text-sm",
    footerActionLink: "!text-[#0EA5E9] font-semibold hover:!text-[#0284C7]",
    footerActionText: "text-[#5C6A7A]",
    dividerLine: "bg-[#E2E8F0]",
    dividerText: "text-[#5C6A7A] text-xs font-medium",
    identityPreviewEditButton: "text-[#0EA5E9] font-semibold",
    formFieldSuccessText: "text-emerald-600 text-xs",
    alert: "rounded-lg border border-amber-300 bg-amber-50 text-amber-900",
    alertText: "text-amber-900 text-sm",
    otpCodeFieldInput: "border border-[#CBD5E1] rounded-lg",
    formFieldRow: "gap-2",
    main: "gap-4",
    logoBox: "mb-2 justify-start",
    logoImage: "h-9 w-9",
  },
};

function AuthSplashWhileSigningIn() {
  return (
    <div className="min-h-[100dvh] grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <LogoMark size={42} />
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    </div>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <AppShell>
          <Dashboard />
        </AppShell>
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <AppShell>{children}</AppShell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 pattern-dots">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 pattern-dots">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) {
        qc.clear();
      }
      prevRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue to ClinicSaathi",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start managing your clinic in a minute",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/patients/new">
              <Protected>
                <NewPatient />
              </Protected>
            </Route>
            <Route path="/patients/:id">
              <Protected>
                <PatientDetail />
              </Protected>
            </Route>
            <Route path="/search">
              <Protected>
                <SearchPage />
              </Protected>
            </Route>
            <Route path="/settings">
              <Protected>
                <SettingsPage />
              </Protected>
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
