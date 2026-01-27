import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/barber/ProfileForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
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
        </Link>
      </div>

      <ProfileForm profile={{ ...profile, email: user.email }} />
    </div>
  );
}
