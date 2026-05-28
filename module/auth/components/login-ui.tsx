"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signIn } from "@/lib/auth-client";

type IconItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

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

const oauthSteps = [
  {
    step: "Step 1",
    title: "Click sign in",
    description: "Start with the secure GitHub OAuth button.",
  },
  {
    step: "Step 2",
    title: "Authorize via GitHub",
    description: "Approve access from the provider developers already trust.",
  },
  {
    step: "Step 3",
    title: "Ready in seconds",
    description: "Land inside a workspace prepared for real engineering work.",
  },
];

const trustItems = [
  { label: "GitHub OAuth", icon: GitHubMark },
  { label: "Secure redirect flow", icon: LockKeyhole },
  { label: "No password storage", icon: KeyRound },
  { label: "Developer-first access", icon: TerminalSquare },
  { label: "Workspace ready instantly", icon: Zap },
];

const whyDevelopers: IconItem[] = [
  {
    title: "Identity that follows the work",
    description:
      "Authenticate through GitHub and keep access aligned with your repositories, pull requests, and engineering context.",
    icon: GitBranch,
  },
  {
    title: "A calm workspace from the first click",
    description:
      "CodeHorse keeps the path from sign-in to productive work short, predictable, and free of account setup drag.",
    icon: Sparkles,
  },
  {
    title: "Signals engineers can trust",
    description:
      "Security status, connected repositories, and activity cues are visible without making the interface feel noisy.",
    icon: ShieldCheck,
  },
];

const securityPoints: IconItem[] = [
  {
    title: "OAuth instead of passwords",
    description:
      "CodeHorse never asks developers to create or remember another password.",
    icon: KeyRound,
  },
  {
    title: "Redirects that stay predictable",
    description:
      "The sign-in path returns users to the workspace with a clear authorization trail.",
    icon: LockKeyhole,
  },
  {
    title: "Access shaped for builders",
    description:
      "The experience is designed around developer identity, repository context, and fast onboarding.",
    icon: Code2,
  },
];

const repos = [
  {
    name: "api-gateway",
    branch: "main",
    status: "Connected",
    tone: "text-success",
  },
  {
    name: "review-worker",
    branch: "ship/auth",
    status: "OAuth ready",
    tone: "text-chart-3",
  },
  {
    name: "web-console",
    branch: "deploy",
    status: "Synced",
    tone: "text-warning",
  },
];

const activity = [38, 64, 44, 78, 54, 86, 62, 72, 48, 82, 58, 92];

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
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative border-b border-border bg-background">
        <div className="codehorse-app-gradient absolute inset-0" />
        <div className="codehorse-grid-overlay absolute inset-0" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="codehorse-brand-gradient flex size-9 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
                <Code2 className="size-4" />
              </span>
              <div>
                <div className="text-base font-semibold">CodeHorse</div>
                <div className="text-base text-muted-foreground">
                  AI Code Reviewer
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                className="hidden h-10 rounded-lg border-border bg-card/80 px-3 text-foreground shadow-sm hover:bg-muted sm:inline-flex"
                onClick={handleGithubLogin}
                type="button"
                variant="outline"
              >
                <GitHubMark className="size-4" />
                Continue
              </Button>
            </div>
          </nav>

          <div className="grid gap-12 pb-14 pt-16 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:pb-20 lg:pt-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/75 px-3 py-1.5 text-base font-medium text-foreground shadow-sm backdrop-blur">
                <ShieldCheck className="size-4 text-success" />
                Secure GitHub authentication
              </div>

              <div className="mt-7 space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] text-foreground sm:text-6xl lg:text-7xl">
                  CodeHorse
                </h1>
                <div className="space-y-3">
                  <p className="max-w-2xl text-2xl font-medium leading-8 text-foreground sm:text-3xl">
                    AI Code Reviewer
                  </p>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    Connect your developer identity in seconds and keep your
                    CodeHorse workspace ready for real projects.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  className="h-12 rounded-lg bg-primary px-5 text-base text-primary-foreground shadow-xl hover:bg-primary/90"
                  disabled={isLoading}
                  onClick={handleGithubLogin}
                  type="button"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <GitHubMark className="size-5" />
                  )}
                  {isLoading ? "Connecting..." : "Continue with GitHub"}
                  {!isLoading ? <ArrowRight className="size-4" /> : null}
                </Button>
                <p className="text-base text-muted-foreground">
                  OAuth via GitHub · No password required · Ready in seconds
                </p>
              </div>

            </div>

            <AuthPreviewCard
              handleGithubLogin={handleGithubLogin}
              isLoading={isLoading}
            />
          </div>

          <OAuthFlowPanel />
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          {trustItems.map((item) => (
            <div
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-base font-medium text-card-foreground transition-colors hover:border-primary/30 hover:bg-muted"
              key={item.label}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground shadow-sm">
                <item.icon className="size-4" />
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-base font-semibold text-primary">
              Why developers use CodeHorse
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-foreground">
              Authentication that feels like part of the engineering workflow.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {whyDevelopers.map((item) => (
              <div
                className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                key={item.title}
              >
                <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-primary-foreground">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-4 py-20 text-card-foreground sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-base font-semibold text-success">
              Security and OAuth
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              A secure sign-in path without slowing developers down.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              CodeHorse keeps authentication familiar, fast, and transparent by
              using GitHub as the trusted identity layer. Developers continue
              with the account they already use to build and ship.
            </p>

            <div className="mt-8 space-y-3">
              {securityPoints.map((item) => (
                <div
                  className="flex gap-5 rounded-lg border border-border bg-muted/40 p-5"
                  key={item.title}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-success/20">
                    <item.icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 text-base leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SecurityConsole />
        </div>
      </section>

      <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.76fr_1fr] lg:items-start">
            <div>
              <p className="text-base font-semibold text-primary">
                Simple 3-step flow
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight text-foreground">
                From GitHub identity to ready workspace in one clean path.
              </h2>
            </div>

            <div className="grid gap-5">
              {oauthSteps.map((item, index) => (
                <div
                  className="group grid gap-5 rounded-lg border border-border bg-card p-5 text-card-foreground transition-all duration-300 hover:border-primary/30 hover:bg-muted/60 hover:shadow-lg sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  key={item.step}
                >
                  <div className="codehorse-brand-gradient flex size-11 items-center justify-center rounded-lg text-base font-semibold text-primary-foreground">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-base leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-border bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="codehorse-app-gradient absolute inset-0" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="codehorse-brand-gradient relative mx-auto flex size-12 items-center justify-center rounded-lg text-primary-foreground shadow-xl">
            <Code2 className="size-5" />
          </div>
          <h2 className="relative mt-6 text-4xl font-semibold leading-tight text-foreground">
            Keep your developer workspace one GitHub click away.
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
            Start with secure authentication and arrive in a workspace built for
            real projects, clean handoffs, and uninterrupted engineering flow.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              className="h-12 rounded-lg bg-primary px-5 text-base text-primary-foreground shadow-xl hover:bg-primary/90"
              disabled={isLoading}
              onClick={handleGithubLogin}
              type="button"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <GitHubMark className="size-5" />
              )}
              {isLoading ? "Connecting..." : "Continue with GitHub"}
              {!isLoading ? <ArrowRight className="size-4" /> : null}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

const AuthPreviewCard = ({
  handleGithubLogin,
  isLoading,
}: {
  handleGithubLogin: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mr-0">
      <div className="codehorse-panel-strong absolute -left-3 top-12 hidden w-40 rounded-lg p-3 text-foreground lg:block">
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <span className="size-2 rounded-full bg-success" />
          Connection live
        </div>
        <div className="mt-3 text-base font-semibold">github.com</div>
        <div className="mt-1 text-base text-muted-foreground">OAuth verified</div>
      </div>

      <div className="codehorse-panel-strong rounded-lg p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-base font-medium text-muted-foreground">
              CodeHorse
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              Sign in with GitHub to continue to your CodeHorse account.
            </p>
          </div>
          <div className="codehorse-brand-gradient flex size-11 items-center justify-center rounded-lg text-primary-foreground">
            <GitHubMark className="size-5" />
          </div>
        </div>

        <Button
          className="mt-7 h-12 w-full rounded-lg bg-primary text-base text-primary-foreground shadow-lg hover:bg-primary/90"
          disabled={isLoading}
          onClick={handleGithubLogin}
          type="button"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <GitHubMark className="size-5" />
          )}
          {isLoading ? "Connecting..." : "Continue with GitHub"}
        </Button>

        <div className="mt-4 rounded-lg border border-border bg-muted/60 px-4 py-3 text-base leading-7 text-muted-foreground">
          Secure redirect note: GitHub authorizes the session, then returns you
          safely to CodeHorse.
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <div className="flex items-center justify-between text-base text-muted-foreground">
            <span>OAuth request</span>
            <span className="rounded-lg bg-success/10 px-2 py-1 font-medium text-success">
              TLS secured
            </span>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-muted p-5 font-mono text-base leading-7 text-muted-foreground">
            <div className="text-chart-3">GET /login/oauth/authorize</div>
            <div>client_id=codehorse</div>
            <div>scope=repo identity</div>
            <div className="text-success">redirect_uri=/dashboard</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="codehorse-panel rounded-lg p-5 text-foreground">
          <div className="flex items-center justify-between">
            <div className="text-base font-medium">Workspace</div>
            <span className="rounded-lg bg-success/10 px-2 py-1 text-base text-success">
              Ready
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {repos.map((repo) => (
              <div className="flex items-center justify-between" key={repo.name}>
                <div>
                  <div className="text-base font-medium">{repo.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-base text-muted-foreground">
                    <GitBranch className="size-3" />
                    {repo.branch}
                  </div>
                </div>
                <div className={`text-base font-medium ${repo.tone}`}>
                  {repo.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="codehorse-panel rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold text-foreground">
              Commit activity
            </div>
            <GitCommitHorizontal className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-5 flex h-24 items-end gap-2">
            {activity.map((height, index) => (
              <span
                className="flex-1 rounded-lg bg-gradient-to-t from-primary to-success"
                key={`${height}-${index}`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-base text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-success" />
            Identity synced across repositories
          </div>
        </div>
      </div>
    </div>
  );
};

const OAuthFlowPanel = () => {
  return (
    <div className="codehorse-panel mt-6 rounded-lg p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-foreground">
            GitHub OAuth flow
          </div>
          <p className="mt-1 text-base text-muted-foreground">
            A clean handoff from sign-in to a ready CodeHorse workspace.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5 text-base font-medium text-success">
          <ShieldCheck className="size-3.5" />
          Secure redirect
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {oauthSteps.map((item) => (
          <div
            className="rounded-lg border border-border bg-card p-5 transition-transform duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
            key={item.step}
          >
            <div className="ch-section-eyebrow">
              {item.step}
            </div>
            <div className="mt-2 text-base font-semibold text-card-foreground">
              {item.title}
            </div>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SecurityConsole = () => {
  return (
    <div className="codehorse-panel rounded-lg p-5">
      <div className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-danger" />
            <span className="size-2 rounded-full bg-warning" />
            <span className="size-2 rounded-full bg-success" />
          </div>
          <div className="text-base text-muted-foreground">auth-flow.ts</div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="font-mono text-base leading-7 text-muted-foreground">
            <div>
              <span className="text-chart-3">const</span>{" "}
              <span className="text-foreground">session</span>{" "}
              <span className="text-muted-foreground">=</span>{" "}
              <span className="text-success">await</span>{" "}
              <span className="text-foreground">github.oauth</span>
              <span className="text-muted-foreground">();</span>
            </div>
            <div>
              <span className="text-chart-3">if</span>{" "}
              <span className="text-muted-foreground">(</span>
              <span className="text-foreground">session.verified</span>
              <span className="text-muted-foreground">)</span>{" "}
              <span className="text-foreground">workspace.ready</span>
              <span className="text-muted-foreground">();</span>
            </div>
            <div className="text-muted-foreground/80">
              {"// No password stored. No extra account drift."}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-base text-muted-foreground">Redirect</span>
                <span className="text-base font-medium text-success">
                  Verified
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-lg bg-muted">
                <div className="h-full w-[86%] rounded-lg bg-success" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-base font-medium">
                <GitPullRequest className="size-4 text-chart-3" />
                Pull request context
              </div>
              <p className="mt-2 text-base leading-7 text-muted-foreground">
                Repository access and developer identity arrive together.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-base font-medium text-success">
              <Clock3 className="size-3.5" />
              Ready in seconds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginUI;
