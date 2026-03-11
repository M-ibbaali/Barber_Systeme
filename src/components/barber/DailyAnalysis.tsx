"use client";

import { Calendar, TrendingUp } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatMoroccoDay } from "@/lib/utils/date";

export default function DailyAnalysis({ incomes }: { incomes: any[] }) {
  const t = useTranslations("DailyAnalysis");
  const locale = useLocale();

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
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          {t("title")}
        </h2>
        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {t("last30Days")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
              <th className="px-6 py-4">{t("headers.date")}</th>
              <th className="px-6 py-4">{t("headers.records")}</th>
              <th className="px-6 py-4 text-right">
                {t("headers.totalAmount")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
            {sortedDays.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-12 text-center text-zinc-400"
                >
                  {t("noData")}
                </td>
              </tr>
            ) : (
              sortedDays.slice(0, 30).map((day) => (
                <tr
                  key={day.date}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {formatMoroccoDay(day.date, locale)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                      {day.count} {t("services")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
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
