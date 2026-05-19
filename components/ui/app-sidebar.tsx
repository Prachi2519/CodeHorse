"use client";

import { BookOpen, LogOut, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth-client";
import Logout from "@/module/auth/components/logout";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BookOpen,
  },
  {
    title: "Repository",
    url: "/dashboard/repository",
    icon: BookOpen,
  },
  {
    title: "Reviews",
    url: "/dashboard/reviews",
    icon: BookOpen,
  },
  {
    title: "Subscription",
    url: "/dashboard/subscription",
    icon: BookOpen,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

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

export const AppSidebar = () => {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();

  const user = session?.user;
  const userName = user?.name || "GUEST";
  const userEmail = user?.email || "aka Sigma";
  const userInitials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`);
  const isDark = resolvedTheme === "dark";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-[#16171b] dark:text-neutral-200"
    >
      <SidebarHeader className="border-b border-neutral-200 px-5 py-8 group-data-[collapsible=icon]:px-3 dark:border-neutral-800">
        <div className="flex items-center gap-4 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#765447] text-white shadow-sm group-data-[collapsible=icon]:size-10 dark:bg-[#fee2c5] dark:text-[#171717]">
            <GitHubMark className="size-6 group-data-[collapsible=icon]:size-5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Connected Account
            </p>
            <p className="truncate text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              @{userName}
            </p>
            <p className="truncate text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              {userEmail}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-9 group-data-[collapsible=icon]:px-3">
        <div className="mb-7 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 group-data-[collapsible=icon]:hidden dark:text-neutral-500">
          Menu
        </div>
        <SidebarMenu className="gap-3">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className="h-12 rounded-md px-4 text-[15px] font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 data-active:bg-neutral-100 data-active:text-neutral-950 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 dark:text-neutral-300 dark:hover:bg-[#27272c] dark:hover:text-white dark:data-active:bg-[#2a2a2f] dark:data-active:text-white"
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

      <SidebarFooter className="mt-auto border-t border-neutral-200 px-4 py-5 group-data-[collapsible=icon]:px-3 dark:border-neutral-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-100 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 dark:hover:bg-[#27272c]"
              type="button"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white shadow-sm ring-1 ring-neutral-700">
                {userInitials || "N"}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {userName}
                </span>
                <span className="block truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {userEmail}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 border-neutral-200 bg-white p-2 text-neutral-900 shadow-2xl dark:border-neutral-800 dark:bg-[#1f2024] dark:text-neutral-100"
            side="right"
            sideOffset={12}
          >
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white ring-1 ring-neutral-700">
                {userInitials || "N"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {userEmail}
                </p>
              </div>
            </div>
            {isDark ? (
              <DropdownMenuItem
                className="h-12 gap-3 rounded-md text-sm font-semibold text-neutral-700 focus:bg-neutral-100 focus:text-neutral-950 dark:text-neutral-200 dark:focus:bg-[#2a2a2f] dark:focus:text-white"
                onClick={() => setTheme("light")}
              >
                <Sun className="size-4" />
                <span>Light Mode</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="h-12 gap-3 rounded-md text-sm font-semibold text-neutral-700 focus:bg-neutral-100 focus:text-neutral-950"
                onClick={() => setTheme("dark")}
              >
                <Moon className="size-4" />
                <span>Dark Mode</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Logout className="flex h-12 w-full items-center gap-3 rounded-md px-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-200 dark:hover:bg-[#2a2a2f] dark:hover:text-white">
                <LogOut />
                <span>Sign Out</span>
              </Logout>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
