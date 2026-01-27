import { createClient } from "@/lib/supabase/server";
import IncomeList from "@/components/barber/IncomeList";
import AddIncomeForm from "@/components/barber/AddIncomeForm";
import {
  Scissors,
  Wallet,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export default async function BarberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Start of week (Monday)
  const todayDate = new Date();
  const day = todayDate.getDay();
  const diff = todayDate.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(todayDate.setDate(diff))
    .toISOString()
    .split("T")[0];

  // Start of month
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  // Fetch all user incomes to calculate stats
  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .eq("barber_id", user?.id)
    .order("date", { ascending: false })
    .order("time", { ascending: false });

  const stats = {
    today:
      incomes
        ?.filter((i) => i.date === today)
        .reduce((acc, i) => acc + Number(i.amount), 0) || 0,
    week:
      incomes
        ?.filter((i) => i.date >= startOfWeek)
        .reduce((acc, i) => acc + Number(i.amount), 0) || 0,
    month:
      incomes
        ?.filter((i) => i.date >= startOfMonth)
        .reduce((acc, i) => acc + Number(i.amount), 0) || 0,
  };

  const todayIncomes = incomes?.filter((i) => i.date === today) || [];

  return (
    <div className="space-y-10">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 line-clamp-1">
            Manage your daily earnings
          </p>
        </div>
        <AddIncomeForm barberId={user?.id} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Wallet className="w-20 h-20 text-amber-500" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Today's Total
          </p>
          <p className="text-4xl font-black mt-2 text-amber-600">
            {stats.today.toFixed(2)} DH
          </p>
        </div>

        {/* Week Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-20 h-20 text-blue-500" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            This Week
          </p>
          <p className="text-4xl font-black mt-2 text-zinc-900 text-balance">
            {stats.week.toFixed(2)} DH
          </p>
        </div>

        {/* Month Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            This Month
          </p>
          <p className="text-4xl font-black mt-2 text-zinc-900 text-balance">
            {stats.month.toFixed(2)} DH
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/30 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-zinc-400" />
            Today's Records
          </h2>
          <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <IncomeList initialIncomes={todayIncomes} />
      </div>
    </div>
  );
}
