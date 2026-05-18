"use client";

import { useState } from "react";
import { Code2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

const GitHubMark = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.41 7.86 10.94.58.1.79-.25.79-.56v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .98-.31 3.18 1.18A11.1 11.1 0 0 1 12 6.06c.98 0 1.96.13 2.88.4 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.42.36.79 1.07.79 2.16v3.13c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const LoginUI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGithubLogin = async () => {
    setIsLoading(true);

    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.20),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#f1f5f9_45%,#ecfeff_100%)] px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-white/70 bg-white/80 shadow-2xl shadow-slate-200/80 backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden min-h-[620px] bg-slate-950 p-10 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.20),transparent_28%),radial-gradient(circle_at_15%_85%,rgba(244,114,182,0.20),transparent_30%)]" />
            <div className="relative z-10 flex items-center gap-2 text-sm font-medium text-cyan-100">
              <span className="flex size-9 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
                <Code2 className="size-4" />
              </span>
              CodeHorse
            </div>

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-50">
                <ShieldCheck className="size-3.5" />
                Secure GitHub authentication
              </div>
              <div className="space-y-4">
                <h1 className="max-w-md text-5xl font-semibold leading-tight tracking-normal">
                  Build, ship, and stay in flow.
                </h1>
                <p className="max-w-sm text-sm leading-6 text-slate-300">
                  Continue with GitHub to connect your developer identity and
                  keep your workspace ready for real projects.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-white/10 bg-white/10 p-4">
                <div className="text-2xl font-semibold">1</div>
                <div className="mt-1 text-slate-300">click sign in</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/10 p-4">
                <div className="text-2xl font-semibold">OAuth</div>
                <div className="mt-1 text-slate-300">via GitHub</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/10 p-4">
                <div className="text-2xl font-semibold">Ready</div>
                <div className="mt-1 text-slate-300">in seconds</div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-10">
            <div className="w-full max-w-sm space-y-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-950 text-white md:mx-0">
                  <GitHubMark className="size-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-normal text-slate-950">
                    Welcome back
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    Sign in with GitHub to continue to your CodeHorse account.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="h-12 w-full gap-2 rounded-md bg-slate-950 text-base text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800"
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <GitHubMark className="size-5" />
                )}
                {isLoading ? "Connecting..." : "Continue with GitHub"}
              </Button>

              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                By continuing, GitHub will redirect you back securely after
                authorization.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginUI;
