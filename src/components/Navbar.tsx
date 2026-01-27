"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Scissors, LogOut, User, LayoutDashboard } from "lucide-react";

export default function Navbar({ profile }: { profile: any }) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={
            profile?.role === "admin" ? "/dashboard/admin" : "/dashboard/barber"
          }
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center transition-transform group-hover:rotate-12">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block text-zinc-900">
            BarberShop
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          {profile?.role === "admin" && (
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-amber-600 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Panel
            </Link>
          )}

          <Link
            href={
              profile?.role === "barber" ? "/dashboard/barber/profile" : "#"
            }
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 transition-all ${profile?.role === "barber" ? "hover:bg-zinc-200 cursor-pointer" : "cursor-default"}`}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <User className="w-4 h-4 text-zinc-500 shrink-0" />
            )}
            <span className="text-sm font-bold text-zinc-700 truncate max-w-[80px] sm:max-w-none">
              {profile?.name || "User"}
            </span>
            <span className="hidden xs:inline-block text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              {profile?.role}
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
