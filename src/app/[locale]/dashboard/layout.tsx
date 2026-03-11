import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { redirect } from "@/i18n/routing";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      suppressHydrationWarning
    >
      <Navbar profile={profile} />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
