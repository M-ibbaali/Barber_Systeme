import { createClient } from "@/lib/supabase/server";
import AdminStats from "@/components/admin/AdminStats";
import BarberManager from "@/components/admin/BarberManager";
import GlobalIncomeTable from "@/components/admin/GlobalIncomeTable";
import PendingActions from "@/components/admin/PendingActions";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import { redirect } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminDashboard(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string; barberId?: string }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const t = await getTranslations("AdminDashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const filterDate =
    searchParams.date || new Date().toISOString().split("T")[0];
  const filterBarberId = searchParams.barberId;

  const { data: barbers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "barber");

  // Fetch emails using Admin API to display in the edit modal
  const {
    data: { users: authUsers },
  } = await supabaseAdmin.auth.admin.listUsers();

  const barbersWithEmail = barbers?.map((barber) => {
    const authUser = authUsers?.find((u) => u.id === barber.id);
    return {
      ...barber,
      email: authUser?.email || "",
    };
  });

  // Fetch strict SOURCE OF TRUTH (only approved records)
  let query = supabase
    .from("incomes")
    .select("*, profiles(name)")
    .eq("date", filterDate)
    .eq("is_deleted", false)
    .order("time", { ascending: false });

  if (filterBarberId) {
    query = query.eq("barber_id", filterBarberId);
  }

  const { data: dailyIncomes } = await query;

  // Fetch pending requests for the queue
  const { data: pendingRequests } = await supabase
    .from("income_requests")
    .select("*")
    .eq("status", "PENDING")
    .order("requested_at", { ascending: false });

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from("income_audit_logs")
    .select("*")
    .order("created_at", { ascending: true });

  // Calculate statistics
  const selectedDate = new Date(filterDate);
  const day = selectedDate.getDay();
  const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(new Date(selectedDate).setDate(diff));
  const weekEnd = new Date(
    new Date(weekStart).setDate(weekStart.getDate() + 6),
  );

  const startOfWeek = weekStart.toISOString().split("T")[0];
  const endOfWeek = weekEnd.toISOString().split("T")[0];

  const startOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
  )
    .toISOString()
    .split("T")[0];

  const { data: allStatsIncomes } = await supabase
    .from("incomes")
    .select("amount, date, barber_id")
    .eq("is_deleted", false);

  const stats = {
    daily:
      allStatsIncomes
        ?.filter((i: any) => i.date === filterDate)
        .filter((i: any) => !filterBarberId || i.barber_id === filterBarberId)
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0,
    week:
      allStatsIncomes
        ?.filter((i: any) => i.date >= startOfWeek && i.date <= endOfWeek)
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0,
    month:
      allStatsIncomes
        ?.filter((i: any) => i.date >= startOfMonth && i.date <= endOfMonth)
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0,
    allTime:
      allStatsIncomes?.reduce(
        (acc: number, curr: any) => acc + Number(curr.amount),
        0,
      ) || 0,
  };

  const barberTotals = allStatsIncomes?.reduce((acc: any, curr: any) => {
    acc[curr.barber_id] = (acc[curr.barber_id] || 0) + Number(curr.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-zinc-400">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <AdminStats
          title={t("stats.daily")}
          value={`${stats.daily.toFixed(2)} DH`}
          subtitle={t("subtitles.daily", {
            date: filterDate,
            filtered: filterBarberId ? t("subtitles.filtered") : "",
          })}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
        />
        <AdminStats
          title={t("stats.weekly")}
          value={`${stats.week.toFixed(2)} DH`}
          subtitle={t("subtitles.weekly")}
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
        />
        <AdminStats
          title={t("stats.monthly")}
          value={`${stats.month.toFixed(2)} DH`}
          subtitle={t("subtitles.monthly")}
          icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
        />
        <AdminStats
          title={t("stats.allTime")}
          value={`${stats.allTime.toFixed(2)} DH`}
          subtitle={t("subtitles.allTime")}
          icon={<DollarSign className="w-6 h-6 text-amber-500" />}
        />
        <AdminStats
          title={t("stats.barbers")}
          value={barbers?.length.toString() || "0"}
          subtitle={t("subtitles.barbers")}
          icon={<Users className="w-6 h-6 text-blue-500" />}
        />
      </div>

      {/* NEW PENDING ACTIONS QUEUE */}
      <PendingActions
        requests={pendingRequests || []}
        barbers={barbers || []}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-1 space-y-6">
          <BarberManager
            initialBarbers={barbersWithEmail || []}
            barberTotals={barberTotals || {}}
          />
        </div>
        <div className="xl:col-span-2 overflow-hidden">
          <GlobalIncomeTable
            incomes={dailyIncomes || []}
            auditLogs={auditLogs || []}
            pendingRequests={pendingRequests || []}
            barbers={barbers || []}
            currentDate={filterDate}
            selectedBarberId={filterBarberId}
          />
        </div>
      </div>
    </div>
  );
}
