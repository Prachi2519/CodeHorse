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
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-3 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
          <Link
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            href="/dashboard"
          >
            <span className="codehorse-brand-gradient flex size-9 items-center justify-center rounded-lg text-sidebar-primary-foreground shadow-lg group-data-[collapsible=icon]:size-8">
              <Activity className="size-4 group-data-[collapsible=icon]:size-4" />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block text-sm leading-5 font-semibold text-sidebar-foreground">
                CodeHorse
              </span>
              <span className="block text-sm leading-5 text-muted-foreground">
                Engineering OS
              </span>
            </span>
          </Link>

          <SidebarCollapseButton />
        </div>

        <div className="mt-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-2.5 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 text-sm leading-5 font-medium text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Connected Account
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="codehorse-brand-gradient flex size-8 items-center justify-center rounded-lg text-sm font-semibold text-sidebar-primary-foreground shadow-sm">
              {userInitials || "P"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm leading-5 font-semibold text-sidebar-foreground">
                @{userName}
              </p>
              <p className="truncate text-sm leading-5 text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar px-3 py-4 group-data-[collapsible=icon]:px-2">
        <div className="mb-2 px-2.5 text-sm leading-5 font-semibold uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Menu
        </div>
        <SidebarMenu className="gap-1">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                className="h-10 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
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

      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-sidebar-border bg-sidebar px-3 py-3 group-data-[collapsible=icon]:px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-2.5 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              type="button"
            >
              <span className="codehorse-brand-gradient flex size-9 items-center justify-center rounded-lg text-sm font-semibold text-sidebar-primary-foreground">
                {userInitials || "P"}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm leading-5 font-semibold text-sidebar-foreground">
                  {userName}
                </span>
                <span className="block truncate text-sm leading-5 text-muted-foreground">
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
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-sm font-semibold text-sidebar-primary-foreground">
                {userInitials || "P"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm leading-5 font-semibold">{userName}</p>
                <p className="truncate text-sm leading-5 text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="my-2 border-t border-border pt-2">
              <p className="mb-2 px-2 text-sm leading-5 font-medium text-muted-foreground">
                Theme
              </p>
              <ThemeToggle className="w-full sm:w-full" />
            </div>

            <DropdownMenuItem asChild>
              <Logout className="flex h-10 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </Logout>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mt-2 flex items-center gap-2 px-2 text-sm leading-5 text-muted-foreground group-data-[collapsible=icon]:hidden">
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
