import { createContext, useContext, useEffect, useMemo } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * The admin now ships a single dark, liquid-glass theme (see globals.css).
 * The light theme has been retired: the WebGL backdrop and glass surfaces
 * are dark-first and don't translate to a light canvas. We keep the provider
 * and hook surface intact so consumers (sonner theme, menus) still work, but
 * the theme is pinned to "dark" and the setters are inert.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: () => {},
      toggle: () => {},
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
