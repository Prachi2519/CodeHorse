import React from "react";

import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/module/auth/utils/auth-utils";

export const dynamic = "force-dynamic";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  await requireAuth();

  return (
    <SidebarProvider className="bg-background text-foreground">
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-transparent">
        <main className="min-h-svh bg-background text-foreground">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
