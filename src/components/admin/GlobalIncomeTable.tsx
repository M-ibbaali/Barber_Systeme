"use client";

import { Calendar, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalIncomeTable({
  incomes,
  auditLogs,
  barbers,
  currentDate,
  selectedBarberId,
}: {
  incomes: any[];
  auditLogs: any[];
  barbers: any[];
  currentDate: string;
  selectedBarberId?: string;
}) {
  const router = useRouter();

  const handleFilterChange = (key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.location.href = url.toString();
  };

  const getRecordStatus = (incomeId: string) => {
    const logs = auditLogs.filter((log) => log.income_id === incomeId);
    const hasUpdate = logs.some((l) => l.action_type === "UPDATE");
    const original = logs.find((l) => l.action_type === "CREATE")?.new_values;

    return {
      isEdited: hasUpdate,
      originalAmount: original?.amount ? Number(original.amount) : null,
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col">
      <div className="p-4 sm:p-6 border-b border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          Income Overview
          <span className="text-xs font-normal text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            Confirmed Data
          </span>
        </h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl focus-within:ring-1 ring-amber-500 transition-all">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={selectedBarberId || ""}
              onChange={(e) => handleFilterChange("barberId", e.target.value)}
              className="bg-transparent text-sm outline-none text-zinc-900 w-full cursor-pointer"
            >
              <option value="">All Barbers</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl focus-within:ring-1 ring-amber-500 transition-all">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="bg-transparent text-sm outline-none text-zinc-900 w-full cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold border-b border-zinc-100">
                <th className="px-6 py-4">Barber</th>
                <th className="px-6 py-4">Approved Amount</th>
                <th className="px-6 py-4">Audit Status</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {incomes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-zinc-400"
                  >
                    No sanctioned income records found.
                  </td>
                </tr>
              ) : (
                incomes.map((income) => {
                  const status = getRecordStatus(income.id);

                  return (
                    <tr
                      key={income.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">
                            {income.profiles?.name?.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-zinc-700">
                            {income.profiles?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900">
                            {income.amount.toFixed(2)} DH
                          </span>
                          {status.isEdited &&
                            status.originalAmount !== null &&
                            status.originalAmount !== income.amount && (
                              <span className="text-[10px] text-zinc-400 uppercase">
                                Initially: {status.originalAmount.toFixed(2)} DH
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {status.isEdited ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 uppercase">
                            Modified & Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase">
                            Original
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{income.time.split(".")[0]}</span>
                          {income.note && (
                            <span className="text-[10px] text-zinc-400 italic truncate max-w-[120px]">
                              {income.note}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
