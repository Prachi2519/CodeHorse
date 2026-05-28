"use client";

import { useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/ui/providers/theme-providers";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle({ className }: { className?: string }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const { setTheme, theme = "system" } = useTheme();

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-11 w-[7.25rem] rounded-lg bg-muted sm:w-[13.5rem]",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid w-[7.25rem] grid-cols-3 gap-1 rounded-lg border border-border bg-muted/60 p-1 sm:w-[13.5rem]",
        className,
      )}
    >
      {themeOptions.map((option) => {
        const isActive = theme === option.value;

        return (
          <button
            aria-label={`Use ${option.label.toLowerCase()} theme`}
            aria-pressed={isActive}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-2 text-sm leading-5 font-medium text-muted-foreground transition-colors hover:text-foreground",
              isActive && "bg-card text-foreground shadow-sm",
            )}
            key={option.value}
            onClick={() => setTheme(option.value)}
            title={option.label}
            type="button"
          >
            <option.icon className="size-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
