import React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { requireAuth } from "@/module/auth/utils/auth-utils";

export const dynamic = "force-dynamic";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth();
  return (
    <SidebarProvider className="bg-white text-neutral-950 dark:bg-black dark:text-white">
      <AppSidebar />
      <SidebarInset className="bg-white text-neutral-950 dark:bg-black dark:text-white">
        <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-neutral-200 bg-white px-6 dark:border-neutral-800 dark:bg-black">
          <SidebarTrigger className="-ml-1 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white" />
          <Separator orientation="vertical" className="h-8 bg-neutral-200 dark:bg-neutral-800" />
          <h1 className="text-2xl font-semibold tracking-normal text-neutral-950 dark:text-white">
            Dashboard
          </h1>
        </header>
        <main className="flex-1 overflow-auto bg-white p-6 text-lg font-medium text-neutral-800 dark:bg-black dark:text-neutral-200">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
