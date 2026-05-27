"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Bot,
  Clock3,
  CreditCard,
  ExternalLink,
  GitBranch,
  KeyRound,
  Link2,
  Loader2,
  LockKeyhole,
  Mail,
  Plug,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  disconnectRepository,
  getConnectedRepositories,
  getUserProfile,
  updateUserProfile,
} from "@/module/settings/actions";

type ConnectedRepository = {
  id: string;
  name: string;
  fullName: string;
  url: string;
  createdAt: string | Date;
};

type IconComponent = ComponentType<{ className?: string }>;

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

const settingsTabs = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "repositories", label: "Repositories", icon: GitBranch },
  { value: "security", label: "Security", icon: ShieldCheck },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "integrations", label: "Integrations", icon: Plug },
  { value: "billing", label: "Billing", icon: CreditCard },
];

const notificationDefaults = [
  {
    id: "reviewCompleted",
    label: "Review completed",
    description: "Notify me when CodeHorse finishes an AI review.",
    enabled: true,
  },
  {
    id: "reviewFailed",
    label: "Review failed",
    description: "Alert me when a review run needs attention.",
    enabled: true,
  },
  {
    id: "repositorySync",
    label: "Repository sync completed",
    description: "Send a signal after GitHub repository syncs complete.",
    enabled: true,
  },
  {
    id: "billingUpdates",
    label: "Billing updates",
    description: "Receive invoices, plan, and usage notifications.",
    enabled: true,
  },
  {
    id: "securityAlerts",
    label: "Security alerts",
    description: "Get notified about access and token changes.",
    enabled: true,
  },
];

const activityRows = [
  {
    title: "GitHub account synced",
    description: "Token-backed workspace signals refreshed.",
    timestamp: "Recently",
    icon: GitHubMark,
  },
  {
    title: "Repository CodeHorse connected",
    description: "Prachi2519/CodeHorse is ready for AI review workflows.",
    timestamp: "26/05/2026",
    icon: GitBranch,
  },
  {
    title: "Token-backed analytics enabled",
    description: "GitHub analytics pipeline is active.",
    timestamp: "Recently",
    icon: ShieldCheck,
  },
];

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(() =>
    Object.fromEntries(
      notificationDefaults.map((item) => [item.id, item.enabled]),
    ) as Record<string, boolean>,
  );

  const { data: session } = useSession();
  const fallbackName = session?.user?.name || "Prachi2519";
  const fallbackEmail = session?.user?.email || "prachi639220@gmail.com";

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => await getUserProfile(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const {
    data: repositories,
    isLoading: isRepositoriesLoading,
    refetch: refetchRepositories,
  } = useQuery({
    queryKey: ["connected-repositories"],
    queryFn: async () => await getConnectedRepositories(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      return await updateUserProfile(data);
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        toast.success("Profile updated successfully");
        return;
      }

      toast.error(result?.error || "Failed to update profile");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      return await disconnectRepository(repositoryId);
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success("Repository disconnected successfully");
        return;
      }

      toast.error(result?.error || "Failed to disconnect repository");
    },
    onError: () => toast.error("Failed to disconnect repository"),
  });

  const userName = profile?.name || fallbackName;
  const userEmail = profile?.email || fallbackEmail;
  const userInitial = userName.charAt(0).toUpperCase() || "P";
  const connectedRepositories = (repositories ?? []) as ConnectedRepository[];
  const connectedRepositoryCount = connectedRepositories.length;

  const accountSignals = useMemo(
    () => [
      {
        label: "GitHub username",
        value: `@${userName}`,
        icon: GitHubMark,
        tone: "text-primary",
      },
      {
        label: "Email",
        value: userEmail,
        icon: Mail,
        tone: "text-chart-3",
      },
      {
        label: "Sync status",
        value: "Active",
        icon: RefreshCw,
        tone: "text-success",
      },
      {
        label: "Token-backed analytics",
        value: "Enabled",
        icon: ShieldCheck,
        tone: "text-success",
      },
      {
        label: "Last synced",
        value: "Recently",
        icon: Clock3,
        tone: "text-warning",
      },
    ],
    [userEmail, userName],
  );

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!name || !email) {
      toast.error("Display name and email are required");
      return;
    }

    updateProfileMutation.mutate({ name, email });
  };

  const handleSyncGitHub = () => {
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
    toast.success("GitHub sync refreshed.");
  };

  const toggleNotification = (id: string) => {
    setNotifications((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <SettingsHeader
          accountEmail={userEmail}
          accountInitial={userInitial}
          accountName={userName}
          onSyncGitHub={handleSyncGitHub}
        />

        <Tabs className="gap-5" defaultValue="profile">
          <TabsList className="codehorse-panel flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-2">
            {settingsTabs.map((tab) => (
              <TabsTrigger
                className="h-9 flex-none rounded-lg px-3 text-sm"
                key={tab.value}
                value={tab.value}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent className="space-y-5" value="profile">
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <div className="space-y-5">
                <ProfileSettingsCard
                  initialEmail={userEmail}
                  initialName={userName}
                  isLoading={isProfileLoading}
                  isSaving={updateProfileMutation.isPending}
                  userInitial={userInitial}
                  onRefreshGitHub={handleSyncGitHub}
                  onSubmit={handleProfileSubmit}
                />
                <ConnectedGitHubCard
                  accountSignals={accountSignals}
                  onDisconnect={() =>
                    toast.info("GitHub disconnect flow is not enabled yet.")
                  }
                  onResync={handleSyncGitHub}
                />
              </div>
              <aside className="space-y-5">
                <WorkspacePreferencesCard />
                <RecentSettingsActivity />
              </aside>
            </section>
          </TabsContent>

          <TabsContent className="space-y-5" value="repositories">
            <ConnectedRepositoriesCard
              deletingRepoId={deletingRepoId}
              isLoading={isRepositoriesLoading}
              repositories={connectedRepositories}
              onConfigure={() => toast.info("Repository configuration coming soon.")}
              onDisconnect={(repositoryId) => {
                setDeletingRepoId(repositoryId);
                disconnectMutation.mutate(repositoryId, {
                  onSettled: () => setDeletingRepoId(null),
                });
              }}
              onRefresh={() => void refetchRepositories()}
            />
          </TabsContent>

          <TabsContent className="space-y-5" value="security">
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <SecurityAccessCard />
              <RecentSettingsActivity />
            </section>
          </TabsContent>

          <TabsContent className="space-y-5" value="notifications">
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <NotificationPreferencesCard
                notifications={notifications}
                onToggle={toggleNotification}
              />
              <RecentSettingsActivity />
            </section>
          </TabsContent>

          <TabsContent className="space-y-5" value="integrations">
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <IntegrationsCard
                connectedRepositoryCount={connectedRepositoryCount}
                onSyncGitHub={handleSyncGitHub}
              />
              <SecurityAccessCard compact />
            </section>
          </TabsContent>

          <TabsContent className="space-y-5" value="billing">
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <BillingSettingsCard />
              <WorkspacePreferencesCard compact />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const SettingsHeader = ({
  accountEmail,
  accountInitial,
  accountName,
  onSyncGitHub,
}: {
  accountEmail: string;
  accountInitial: string;
  accountName: string;
  onSyncGitHub: () => void;
}) => {
  return (
    <header className="codehorse-panel rounded-lg p-4">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="codehorse-brand-gradient flex size-12 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
            <Settings className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-success/20 bg-success/10 text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                All systems operational
              </Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <GitHubMark className="size-3" />
                GitHub synced
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Manage your account, connected repositories, security, and
              workspace preferences.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-10 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onSyncGitHub}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Sync GitHub
          </Button>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-sm font-semibold text-primary-foreground">
              {accountInitial || "P"}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-foreground">
                @{accountName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {accountEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const ProfileSettingsCard = ({
  initialEmail,
  initialName,
  isLoading,
  isSaving,
  userInitial,
  onRefreshGitHub,
  onSubmit,
}: {
  initialEmail: string;
  initialName: string;
  isLoading: boolean;
  isSaving: boolean;
  userInitial: string;
  onRefreshGitHub: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => {
  return (
    <section className="codehorse-panel-strong rounded-lg p-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            Profile Settings
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Update your profile information and GitHub-linked identity.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <span className="codehorse-brand-gradient flex size-12 items-center justify-center rounded-lg text-lg font-semibold text-primary-foreground">
            {userInitial || "P"}
          </span>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-success/20 bg-success/10 text-success">
                <GitHubMark className="size-3" />
                GitHub connected
              </Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <Mail className="size-3" />
                Verified email
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <form
        className="mt-6 grid gap-4 lg:grid-cols-3"
        key={`${initialName}-${initialEmail}`}
        onSubmit={onSubmit}
      >
        <FieldBlock label="Display name">
          <Input
            className="h-10 bg-background/70"
            defaultValue={initialName}
            disabled={isLoading || isSaving}
            name="name"
            placeholder="Prachi2519"
          />
        </FieldBlock>
        <FieldBlock label="Email">
          <Input
            className="h-10 bg-background/70"
            defaultValue={initialEmail}
            disabled={isLoading || isSaving}
            name="email"
            placeholder="prachi639220@gmail.com"
            type="email"
          />
        </FieldBlock>
        <FieldBlock label="GitHub username">
          <Input
            className="h-10 bg-background/70"
            disabled
            value={`@${initialName}`}
          />
        </FieldBlock>

        <div className="flex flex-col gap-2 lg:col-span-3 sm:flex-row">
          <Button disabled={isSaving} type="submit">
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onRefreshGitHub}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Refresh GitHub Profile
          </Button>
        </div>
      </form>
    </section>
  );
};

const ConnectedGitHubCard = ({
  accountSignals,
  onDisconnect,
  onResync,
}: {
  accountSignals: {
    label: string;
    value: string;
    icon: IconComponent;
    tone: string;
  }[];
  onDisconnect: () => void;
  onResync: () => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Account
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Connected GitHub Account
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onResync}
            size="sm"
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-3.5" />
            Re-sync account
          </Button>
          <Button
            className="border-danger/20 bg-danger/10 text-danger hover:bg-danger/20"
            onClick={onDisconnect}
            size="sm"
            type="button"
            variant="outline"
          >
            Disconnect GitHub
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {accountSignals.map((signal) => (
          <SignalTile
            icon={signal.icon}
            key={signal.label}
            label={signal.label}
            tone={signal.tone}
            value={signal.value}
          />
        ))}
      </div>
    </section>
  );
};

const ConnectedRepositoriesCard = ({
  deletingRepoId,
  isLoading,
  repositories,
  onConfigure,
  onDisconnect,
  onRefresh,
}: {
  deletingRepoId: string | null;
  isLoading: boolean;
  repositories: ConnectedRepository[];
  onConfigure: () => void;
  onDisconnect: (repositoryId: string) => void;
  onRefresh: () => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Repositories
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Connected Repositories
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage GitHub repositories connected to CodeHorse for AI reviews
            and analytics.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onRefresh}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/repository">
              <GitBranch className="size-4" />
              Connect another repository
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <>
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </>
        ) : repositories.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
            <GitBranch className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">
              No repositories connected yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Connect repositories from the Repository page to enable analytics
              and AI-powered reviews.
            </p>
          </div>
        ) : (
          repositories.map((repo) => (
            <RepositoryRow
              deletingRepoId={deletingRepoId}
              key={repo.id}
              repository={repo}
              onConfigure={onConfigure}
              onDisconnect={onDisconnect}
            />
          ))
        )}
      </div>
    </section>
  );
};

const RepositoryRow = ({
  deletingRepoId,
  repository,
  onConfigure,
  onDisconnect,
}: {
  deletingRepoId: string | null;
  repository: ConnectedRepository;
  onConfigure: () => void;
  onDisconnect: (repositoryId: string) => void;
}) => {
  const isDeleting = deletingRepoId === repository.id;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-foreground">
              {repository.name}
            </h3>
            <Badge className="border-success/20 bg-success/10 text-success">
              Connected
            </Badge>
            <Badge className="border-primary/20 bg-primary/10 text-primary">
              Ready
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {repository.fullName}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Connected date: {formatDate(repository.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={repository.url} rel="noreferrer" target="_blank">
              <ExternalLink className="size-3.5" />
              View repository
            </a>
          </Button>
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onConfigure}
            size="sm"
            type="button"
            variant="outline"
          >
            <SlidersHorizontal className="size-3.5" />
            Configure
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="border-danger/20 bg-danger/10 text-danger hover:bg-danger/20"
                disabled={isDeleting}
                size="sm"
                type="button"
                variant="outline"
              >
                {isDeleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-danger" />
                  Disconnect {repository.name}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This removes CodeHorse review and analytics access for{" "}
                  {repository.fullName}. You can reconnect it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={() => onDisconnect(repository.id)}
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

const SecurityAccessCard = ({ compact = false }: { compact?: boolean }) => {
  const items = [
    {
      title: "OAuth via GitHub",
      description: "Authentication stays with GitHub's OAuth flow.",
      icon: GitHubMark,
    },
    {
      title: "No password stored",
      description: "CodeHorse never stores a separate app password.",
      icon: KeyRound,
    },
    {
      title: "Secure token-backed analytics",
      description: "Analytics are powered by authorized GitHub tokens.",
      icon: LockKeyhole,
    },
    {
      title: "GitHub permission controls",
      description: "Repository access follows GitHub permissions.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Security
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Security & Access
          </h2>
        </div>
        {!compact ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <ShieldCheck className="size-3.5" />
              Review permissions
            </Button>
            <Button
              className="border-border bg-card/70 text-foreground hover:bg-muted"
              size="sm"
              variant="outline"
            >
              <RefreshCw className="size-3.5" />
              Rotate access token
            </Button>
          </div>
        ) : null}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div
            className="rounded-lg border border-border bg-card p-4"
            key={item.title}
          >
            <div className="flex items-start gap-3">
              <span className="rounded-lg border border-border bg-muted/60 p-2 text-success">
                <item.icon className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const NotificationPreferencesCard = ({
  notifications,
  onToggle,
}: {
  notifications: Record<string, boolean>;
  onToggle: (id: string) => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Notifications
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">
          Notification Preferences
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Choose which workspace events should reach you immediately.
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {notificationDefaults.map((item) => (
          <div
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            key={item.id}
          >
            <div>
              <h3 className="font-semibold text-foreground">{item.label}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </div>
            <Switch
              checked={notifications[item.id]}
              onCheckedChange={() => onToggle(item.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

const WorkspacePreferencesCard = ({ compact = false }: { compact?: boolean }) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Workspace
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">
          Workspace Preferences
        </h2>
      </div>
      <div className="mt-5 space-y-4">
        <PreferenceSelect
          label="Default review mode"
          options={["Standard", "Strict", "Lightweight"]}
        />
        <PreferenceSelect
          label="Dashboard refresh"
          options={["On focus", "Manual", "Every 5 minutes"]}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Theme</p>
          <ThemeToggle />
        </div>
        {!compact ? (
          <PreferenceSelect
            label="Data retention"
            options={["Default", "90 days", "1 year"]}
          />
        ) : null}
      </div>
    </section>
  );
};

const PreferenceSelect = ({
  label,
  options,
}: {
  label: string;
  options: string[];
}) => {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>
      <NativeSelect aria-label={label} className="w-full">
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
};

const IntegrationsCard = ({
  connectedRepositoryCount,
  onSyncGitHub,
}: {
  connectedRepositoryCount: number;
  onSyncGitHub: () => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Integrations
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">
          Connected services
        </h2>
      </div>
      <div className="mt-5 grid gap-3">
        <IntegrationRow
          actionLabel="Re-sync"
          description={`${connectedRepositoryCount} repositories connected for analytics and AI reviews.`}
          icon={GitHubMark}
          status="Connected"
          title="GitHub"
          onAction={onSyncGitHub}
        />
        <IntegrationRow
          actionLabel="Configure"
          description="Review webhooks and background jobs for pull request intelligence."
          icon={Zap}
          status="Ready"
          title="CodeHorse Review Engine"
          onAction={() => toast.info("Review engine configuration coming soon.")}
        />
        <IntegrationRow
          actionLabel="View"
          description="Billing integration is prepared for secure subscription management."
          icon={CreditCard}
          status="Secure"
          title="Billing"
          onAction={() => toast.info("Billing portal will be available soon.")}
        />
      </div>
    </section>
  );
};

const IntegrationRow = ({
  actionLabel,
  description,
  icon: Icon,
  status,
  title,
  onAction,
}: {
  actionLabel: string;
  description: string;
  icon: IconComponent;
  status: string;
  title: string;
  onAction: () => void;
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="rounded-lg border border-border bg-muted/60 p-2 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge className="border-success/20 bg-success/10 text-success">
              {status}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Button
        className="border-border bg-card/70 text-foreground hover:bg-muted"
        onClick={onAction}
        size="sm"
        type="button"
        variant="outline"
      >
        <Link2 className="size-3.5" />
        {actionLabel}
      </Button>
    </div>
  );
};

const BillingSettingsCard = () => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Billing
          </p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">
            Plan and billing controls
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage subscription access and billing readiness for the workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/subscription">
            <CreditCard className="size-4" />
            Open Subscription
          </Link>
        </Button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <SignalTile
          icon={CreditCard}
          label="Current plan"
          tone="text-primary"
          value="Free"
        />
        <SignalTile
          icon={Bot}
          label="AI reviews used"
          tone="text-success"
          value="0"
        />
        <SignalTile
          icon={Sparkles}
          label="Upgrade path"
          tone="text-warning"
          value="Pro ready"
        />
      </div>
    </section>
  );
};

const RecentSettingsActivity = () => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Audit
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">
          Recent Settings Activity
        </h2>
      </div>
      <div className="mt-5 space-y-3">
        {activityRows.map((row) => (
          <div
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            key={row.title}
          >
            <span className="rounded-lg border border-border bg-muted/60 p-2 text-success">
              <row.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {row.title}
                </h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {row.timestamp}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {row.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const FieldBlock = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
};

const SignalTile = ({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: IconComponent;
  label: string;
  tone: string;
  value: string;
}) => {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn("size-3.5", tone)} />
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
};

const formatDate = (value: string | Date) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

export default SettingsPage;
