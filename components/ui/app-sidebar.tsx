"use client";

import {
  Activity,
  Bot,
  ChevronUp,
  CircleDot,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  LogOut,
  PanelLeftIcon,
  Settings,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";
import Logout from "@/module/auth/components/logout";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Repository",
    url: "/dashboard/repository",
    icon: GitBranch,
  },
  {
    title: "Reviews",
    url: "/dashboard/reviews",
    icon: Bot,
  },
  {
    title: "Subscription",
    url: "/dashboard/subscription",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Diagnostics",
    url: "/dashboard/diagnostics",
    icon: Stethoscope,
  },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const userName = user?.name || "Prachi2519";
  const userEmail = user?.email || "prachi639220@gmail.com";
  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive = (url: string) =>
    url === "/dashboard"
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`);

  return (
    <Sidebar
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-4 py-5 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <Link
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            href="/dashboard"
          >
            <span className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-sidebar-primary-foreground shadow-lg group-data-[collapsible=icon]:size-8">
              <Activity className="size-5 group-data-[collapsible=icon]:size-4" />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-base font-semibold text-sidebar-foreground">
                CodeHorse
              </span>
              <span className="block text-base text-muted-foreground">
                Engineering OS
              </span>
            </span>
          </Link>

          <SidebarCollapseButton />
        </div>

        <div className="mt-4 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-base font-medium text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Connected Account
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="codehorse-brand-gradient flex size-9 items-center justify-center rounded-lg text-base font-semibold text-sidebar-primary-foreground shadow-sm">
              {userInitials || "P"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-sidebar-foreground">
                @{userName}
              </p>
              <p className="truncate text-base text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar px-3 py-5 group-data-[collapsible=icon]:px-2">
        <div className="mb-3 px-3 text-sm leading-5 font-semibold uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Menu
        </div>
        <SidebarMenu className="gap-1.5">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                className="h-11 rounded-lg px-3 text-base font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                isActive={isActive(item.url)}
              >
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-6 rounded-lg border border-primary/15 bg-primary/5 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-base font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            Token-backed analytics
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-muted">
            <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-primary to-success" />
          </div>
          <p className="mt-2 text-base leading-6 text-muted-foreground">
            GitHub synced and ready for live workspace signals.
          </p>
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border bg-sidebar px-3 py-4 group-data-[collapsible=icon]:px-2">
        <ThemeToggle className="mb-3 group-data-[collapsible=icon]:hidden" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-3 py-3 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              type="button"
            >
              <span className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-base font-semibold text-sidebar-primary-foreground">
                {userInitials || "P"}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-base font-semibold text-sidebar-foreground">
                  {userName}
                </span>
                <span className="block truncate text-base text-muted-foreground">
                  {userEmail}
                </span>
              </span>
              <ChevronUp className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 border-border bg-popover p-2 text-popover-foreground shadow-2xl"
            side="right"
            sideOffset={12}
          >
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="codehorse-brand-gradient flex size-11 items-center justify-center rounded-lg text-base font-semibold text-sidebar-primary-foreground">
                {userInitials || "P"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{userName}</p>
                <p className="truncate text-base text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>
            <DropdownMenuItem asChild>
              <Logout className="flex h-11 w-full items-center gap-3 rounded-lg px-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </Logout>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mt-3 flex items-center gap-2 px-2 text-base text-muted-foreground group-data-[collapsible=icon]:hidden">
          <CircleDot className="size-3 text-success" />
          All systems operational
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

const SidebarCollapseButton = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const label = isCollapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="hidden size-10 shrink-0 rounded-lg border border-sidebar-border bg-sidebar-accent/60 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 md:flex"
          onClick={toggleSidebar}
          title={label}
          type="button"
          variant="ghost"
        >
          <PanelLeftIcon
            className={`size-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};
