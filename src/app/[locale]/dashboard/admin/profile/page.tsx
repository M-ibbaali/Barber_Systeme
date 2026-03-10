import { createClient } from "@/lib/supabase/server";
import { redirect, Link } from "@/i18n/routing";
import ProfileForm from "@/components/barber/ProfileForm";
import { ChevronLeft } from "lucide-react";

export default async function AdminProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect({ href: "/login", locale });
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <div className="p-2 rounded-full border border-zinc-200 group-hover:bg-zinc-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">
            Back to Dashboard
          </span>
        </Link>
      </div>

      <ProfileForm profile={{ ...profile, email: user.email }} />
    </div>
  );
}
