"use client";

import { Calendar, TrendingUp } from "lucide-react";

export default function DailyAnalysis({ incomes }: { incomes: any[] }) {
  // Group incomes by date and calculate totals
  const dailyTotals = incomes.reduce((acc: any, curr) => {
    const date = curr.date;
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0 };
    }

    acc[date].total += Number(curr.amount);
    acc[date].count += 1;
    return acc;
  }, {});

  // Convert to array and sort by date descending
  const sortedDays = Object.keys(dailyTotals)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      date,
      total: dailyTotals[date].total,
      count: dailyTotals[date].count,
    }));

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-200 bg-zinc-50/30 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          Daily Performance
        </h2>
        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
          Last 30 Days
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Records</th>
              <th className="px-6 py-4 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {sortedDays.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-zinc-400"
                >
                  No historical data available.
                </td>
              </tr>
            ) : (
              sortedDays.slice(0, 30).map((day) => (
                <tr
                  key={day.date}
                  className="hover:bg-zinc-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-zinc-700">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-500 font-medium">
                      {day.count} services
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-zinc-900">
                      {day.total.toFixed(2)} DH
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
