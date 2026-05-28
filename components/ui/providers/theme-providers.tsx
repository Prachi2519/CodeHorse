"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  disableTransitionOnChange = false,
  enableSystem = true,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(storageKey, defaultTheme),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );

  const applyTheme = useCallback(
    (nextTheme: Theme, nextSystemTheme = systemTheme) => {
      const cleanup = disableTransitionOnChange
        ? disableThemeTransitions()
        : undefined;
      const resolvedTheme = resolveTheme(nextTheme, nextSystemTheme, enableSystem);
      const root = document.documentElement;

      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      root.style.colorScheme = resolvedTheme;
      cleanup?.();
    },
    [disableTransitionOnChange, enableSystem, systemTheme],
  );

  const setTheme: Dispatch<SetStateAction<string>> = useCallback(
    (value) => {
      setThemeState((currentTheme) => {
        const nextTheme = normalizeTheme(
          typeof value === "function" ? value(currentTheme) : value,
          defaultTheme,
        );

        try {
          window.localStorage.setItem(storageKey, nextTheme);
        } catch {
          // localStorage can be unavailable in private or locked-down contexts.
        }

        return nextTheme;
      });
    },
    [defaultTheme, storageKey],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [applyTheme, theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(getSystemTheme(mediaQuery));

    onChange();
    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) {
        return;
      }

      setThemeState(normalizeTheme(event.newValue, defaultTheme));
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, [defaultTheme, storageKey]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme: resolveTheme(theme, systemTheme, enableSystem),
      setTheme,
      systemTheme,
      theme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
    }),
    [enableSystem, setTheme, systemTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  attribute?: "class" | `data-${string}` | Array<"class" | `data-${string}`>;
  children: ReactNode;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
  enableSystem?: boolean;
  storageKey?: string;
};

type ThemeContextValue = {
  resolvedTheme: ResolvedTheme;
  setTheme: Dispatch<SetStateAction<string>>;
  systemTheme: ResolvedTheme;
  theme: Theme;
  themes: string[];
};

const ThemeContext = createContext<ThemeContextValue>({
  resolvedTheme: "light",
  setTheme: () => {},
  systemTheme: "light",
  theme: "system",
  themes: ["light", "dark", "system"],
});

const normalizeTheme = (value: string | null | undefined, fallback: Theme) => {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : fallback;
};

const getInitialTheme = (storageKey: string, fallback: Theme) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return normalizeTheme(window.localStorage.getItem(storageKey), fallback);
  } catch {
    return fallback;
  }
};

const getSystemTheme = (mediaQuery?: MediaQueryList): ResolvedTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const query =
    mediaQuery ?? window.matchMedia("(prefers-color-scheme: dark)");

  return query.matches ? "dark" : "light";
};

const resolveTheme = (
  theme: Theme,
  systemTheme: ResolvedTheme,
  enableSystem: boolean,
): ResolvedTheme => {
  if (theme === "system") {
    return enableSystem ? systemTheme : "light";
  }

  return theme;
};

const disableThemeTransitions = () => {
  const style = document.createElement("style");

  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    window.setTimeout(() => document.head.removeChild(style), 1);
  };
};
