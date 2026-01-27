import { createClient } from "@/lib/supabase/server";
import AdminStats from "@/components/admin/AdminStats";
import BarberManager from "@/components/admin/BarberManager";
import GlobalIncomeTable from "@/components/admin/GlobalIncomeTable";
import { Users, TrendingUp, DollarSign } from "lucide-react";

export default async function AdminDashboard(props: {
  searchParams: Promise<{ date?: string; barberId?: string }>;
}) {
  // Correctly await searchParams for Next.js 15+ compatibility
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const filterDate =
    searchParams.date || new Date().toISOString().split("T")[0];
  const filterBarberId = searchParams.barberId;

  // Fetch all barbers
  const { data: barbers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "barber");

  let query = supabase
    .from("incomes")
    .select("*, profiles(name)")
    .eq("date", filterDate)
    .order("time", { ascending: false });

  if (filterBarberId) {
    query = query.eq("barber_id", filterBarberId);
  }

  const { data: dailyIncomes } = await query;

  // Calculate statistics relative to the SELECTED date (filterDate)
  const selectedDate = new Date(filterDate);

  // Start of week for the SELECTED date (Monday)
  const day = selectedDate.getDay();
  const diff = selectedDate.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(new Date(selectedDate).setDate(diff));
  const weekEnd = new Date(
    new Date(weekStart).setDate(weekStart.getDate() + 6),
  );

  const startOfWeek = weekStart.toISOString().split("T")[0];
  const endOfWeek = weekEnd.toISOString().split("T")[0];

  // Start and End of month for the SELECTED date
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

  // Fetch all time income per barber
  const { data: allTimeIncomes } = await supabase
    .from("incomes")
    .select("barber_id, amount, date");

  const barberTotals = allTimeIncomes?.reduce((acc: any, curr) => {
    acc[curr.barber_id] = (acc[curr.barber_id] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const stats = {
    daily:
      dailyIncomes?.reduce(
        (acc: number, curr: any) => acc + Number(curr.amount),
        0,
      ) || 0,
    week:
      allTimeIncomes
        ?.filter((i) => i.date >= startOfWeek && i.date <= endOfWeek)
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0,
    month:
      allTimeIncomes
        ?.filter((i) => i.date >= startOfMonth && i.date <= endOfMonth)
        .reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0,
    allTime:
      allTimeIncomes?.reduce(
        (acc: number, curr: any) => acc + Number(curr.amount),
        0,
      ) || 0,
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-zinc-400">
            Shop-wide performance and staff management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
        <AdminStats
          title="Daily Total"
          value={`${stats.daily.toFixed(2)} DH`}
          subtitle={`For ${filterDate}${filterBarberId ? ` (Filtered)` : ""}`}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
        />
        <AdminStats
          title="Weekly Total"
          value={`${stats.week.toFixed(2)} DH`}
          subtitle="Full week of selected date"
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
        />
        <AdminStats
          title="Monthly Total"
          value={`${stats.month.toFixed(2)} DH`}
          subtitle="Full month of selected date"
          icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
        />
        <AdminStats
          title="All-Time Total"
          value={`${stats.allTime.toFixed(2)} DH`}
          subtitle="Since start"
          icon={<DollarSign className="w-6 h-6 text-amber-500" />}
        />
        <AdminStats
          title="Active Barbers"
          value={barbers?.length.toString() || "0"}
          subtitle="Registered staff"
          icon={<Users className="w-6 h-6 text-blue-500" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-1 space-y-6">
          <BarberManager
            initialBarbers={barbers || []}
            barberTotals={barberTotals || {}}
          />
        </div>
        <div className="xl:col-span-2 overflow-hidden">
          <GlobalIncomeTable
            incomes={dailyIncomes || []}
            barbers={barbers || []}
            currentDate={filterDate}
            selectedBarberId={filterBarberId}
          />
        </div>
      </div>
    </div>
  );
}
