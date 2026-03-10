import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/routing";
import ProfileForm from "@/components/barber/ProfileForm";

export default async function BarberProfilePage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileForm profile={{ ...profile, email: user.email }} />
    </div>
  );
}
