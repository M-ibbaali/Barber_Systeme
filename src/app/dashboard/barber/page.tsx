import { createClient } from "@/lib/supabase/server";
import IncomeList from "@/components/barber/IncomeList";
import AddIncomeForm from "@/components/barber/AddIncomeForm";
import DailyAnalysis from "@/components/barber/DailyAnalysis";
import BarberDatePicker from "@/components/barber/BarberDatePicker";
import {
  Wallet,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3,
  Clock,
} from "lucide-react";

export default async function BarberDashboard(props: {
  searchParams: Promise<{ date?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];
  const filterDate = searchParams.date || today;
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

  // Fetch all user incomes
  const { data: rawIncomes } = await supabase
    .from("incomes")
    .select("*")
    .eq("barber_id", user?.id)
    .eq("is_deleted", false)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  // Fetch all pending requests for this user
  const { data: pendingRequests } = await supabase
    .from("income_requests")
    .select("*")
    .eq("barber_id", user?.id)
    .eq("status", "PENDING");

  // MERGE LOGIC: Apply pending requests to original records for the barber's "Shadow State"
  const incomes = (rawIncomes || [])
    .map((income) => {
      const request = pendingRequests?.find((r) => r.income_id === income.id);
      if (!request) return income;

      if (request.action_type === "DELETE") {
        return { ...income, _is_pending_deleted: true };
      }

      if (request.action_type === "UPDATE") {
        return {
          ...income,
          amount: request.new_amount,
          note: request.new_note,
          _is_pending_updated: true,
        };
      }
      return income;
    })
    .filter((i) => !i._is_pending_deleted);

  const stats = {
    selected:
      incomes
        ?.filter((i) => i.date === filterDate)
        .reduce((acc, i) => acc + Number(i.amount), 0) || 0,
    week:
      incomes
        ?.filter((i) => i.date >= startOfWeek && i.date <= endOfWeek)
        .reduce((acc, i) => acc + Number(i.amount), 0) || 0,
    month:
      incomes
        ?.filter((i) => i.date >= startOfMonth && i.date <= endOfMonth)
        .reduce((acc, i) => acc + Number(i.amount), 0) || 0,
  };

  const filteredIncomes = incomes?.filter((i) => i.date === filterDate) || [];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 line-clamp-1">
            Manage your daily earnings & performance
          </p>
        </div>
        <AddIncomeForm barberId={user?.id} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Selected Date Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
              {filterDate === today
                ? "Today's Total"
                : `Total for ${filterDate}`}
            </p>
            <p className="text-3xl font-bold mt-2 text-amber-600">
              {stats.selected.toFixed(2)} DH
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Earnings for selected day
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Week Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
              Weekly (Selected Period)
            </p>
            <p className="text-3xl font-bold mt-2 text-zinc-900">
              {stats.week.toFixed(2)} DH
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Total for the seven-day period
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Month Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
              Monthly (Selected Period)
            </p>
            <p className="text-3xl font-bold mt-2 text-zinc-900">
              {stats.month.toFixed(2)} DH
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Total for the current month
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Daily Performance Analysis */}
        <div className="order-2 xl:order-1">
          <DailyAnalysis incomes={incomes || []} />
        </div>

        {/* Records Section */}
        <div className="order-1 xl:order-2 bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              Records for {filterDate === today ? "Today" : filterDate}
            </h2>
            <BarberDatePicker defaultValue={filterDate} />
          </div>
          <IncomeList initialIncomes={filteredIncomes} />
        </div>
      </div>
    </div>
  );
}
