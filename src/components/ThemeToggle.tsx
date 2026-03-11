"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-500 transition-all active:scale-90 flex items-center justify-center overflow-hidden group shadow-sm border border-zinc-200 dark:border-zinc-700"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <SunMedium className="absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 duration-500 ease-out" />
        <MoonStar className="absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 duration-500 ease-out" />
      </div>

      {/* Subtle hover ring */}
      <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-amber-500/20 transition-colors" />
    </button>
  );
}
