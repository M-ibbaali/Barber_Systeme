"use client";

import { Link, useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { Scissors, LogOut, User, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar({ profile }: { profile: any }) {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Navigation");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav
      className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50"
      suppressHydrationWarning
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={
            profile?.role === "admin" ? "/dashboard/admin" : "/dashboard/barber"
          }
          className="flex items-center gap-2 group"
        >
          <img
            src={
              mounted && resolvedTheme === "dark"
                ? "/logo-dark.png"
                : "/logo.png"
            }
            alt="BarberShop"
            className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <LanguageSwitcher />
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-4 sm:gap-6">
            <Link
              href={
                profile?.role === "barber"
                  ? "/dashboard/barber/profile"
                  : profile?.role === "admin"
                    ? "/dashboard/admin/profile"
                    : "#"
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all ${
                ["barber", "admin"].includes(profile?.role)
                  ? "hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              )}
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[80px] sm:max-w-none">
                {profile?.name || "User"}
              </span>
              <span className="hidden xs:inline-block text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500">
                {profile?.role}
              </span>
            </Link>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title={t("signOut")}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
