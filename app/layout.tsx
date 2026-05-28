import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "react-activity-calendar/tooltips.css";
import { ThemeProvider } from "@/components/ui/providers/theme-providers";
import { QueryProvider } from "@/components/ui/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeHorse | AI Code Reviewer",
  description:
    "Secure GitHub authentication and developer workspace access for builders who move fast.",
};

const themeInitScript = `
(() => {
  try {
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem("theme") || "system";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const resolvedTheme = storedTheme === "system" ? systemTheme : storedTheme;

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme === "dark" ? "dark" : "light");
    root.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light";
  } catch {
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <Script
          id="codehorse-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="theme"
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
