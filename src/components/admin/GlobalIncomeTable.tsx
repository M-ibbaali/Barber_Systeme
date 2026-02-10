"use client";

import {
  Calendar,
  Filter,
  Check,
  X,
  Loader2,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ViewIncomeModal from "./ViewIncomeModal";
import AdminEditIncomeModal from "./AdminEditIncomeModal";
import CustomDialog from "../ui/CustomDialog";

export default function GlobalIncomeTable({
  incomes,
  auditLogs,
  pendingRequests,
  barbers,
  currentDate,
  selectedBarberId,
}: {
  incomes: any[];
  auditLogs: any[];
  pendingRequests: any[];
  barbers: any[];
  currentDate: string;
  selectedBarberId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingIncome, setViewingIncome] = useState<any | null>(null);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.location.href = url.toString();
  };

  const handleAction = async (
    request: any,
    status: "APPROVED" | "REJECTED",
  ) => {
    setProcessingId(request.id);

    try {
      if (status === "APPROVED") {
        if (request.action_type === "UPDATE") {
          await supabase
            .from("incomes")
            .update({
              amount: request.new_amount,
              note: request.new_note,
              updated_at: new Date().toISOString(),
            })
            .eq("id", request.income_id);
        } else if (request.action_type === "DELETE") {
          await supabase
            .from("incomes")
            .update({ is_deleted: true })
            .eq("id", request.income_id);
        }
      }

      await supabase
        .from("income_requests")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", request.id);

      router.refresh();
    } catch (err) {
      alert("Error processing action");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingIncome) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("incomes")
        .update({ is_deleted: true })
        .eq("id", deletingIncome.id);

      if (!error) {
        setDeletingIncome(null);
        router.refresh();
      } else {
        alert("Error deleting record: " + error.message);
      }
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRecordState = (incomeId: string) => {
    const pending = pendingRequests.find((r) => r.income_id === incomeId);
    const logs = auditLogs.filter((log) => log.income_id === incomeId);
    const hasUpdate = logs.some((l) => l.action_type === "UPDATE");
    const original = logs.find((l) => l.action_type === "CREATE")?.new_values;

    return {
      pending,
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
            Audit Safe
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
        <div className="min-w-[700px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold border-b border-zinc-100">
                <th className="px-6 py-4">Barber</th>
                <th className="px-6 py-4">Financial State</th>
                <th className="px-6 py-4">Audit Status</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {incomes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-400"
                  >
                    No confirmed income for this date.
                  </td>
                </tr>
              ) : (
                incomes.map((income) => {
                  const state = getRecordState(income.id);
                  const isPending = !!state.pending;

                  return (
                    <tr
                      key={income.id}
                      className={`hover:bg-zinc-50 transition-colors ${isPending ? "bg-amber-50/30" : ""}`}
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${isPending && state.pending?.action_type === "DELETE" ? "line-through text-zinc-400" : "text-zinc-900"}`}
                            >
                              {income.amount.toFixed(2)} DH
                            </span>
                            {isPending &&
                              state.pending?.action_type === "UPDATE" && (
                                <>
                                  <span className="text-zinc-300">→</span>
                                  <span className="font-bold text-amber-600">
                                    {state.pending.new_amount.toFixed(2)} DH
                                  </span>
                                </>
                              )}
                          </div>
                          {state.originalAmount !== null &&
                            state.originalAmount !== income.amount && (
                              <span className="text-[10px] text-zinc-400 uppercase">
                                Initially: {state.originalAmount.toFixed(2)} DH
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPending ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase animate-pulse ${
                              state.pending?.action_type === "DELETE"
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                          >
                            Pending {state.pending?.action_type}
                          </span>
                        ) : state.isEdited ? (
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
                          <span>
                            {(() => {
                              const [hours, minutes, seconds] = income.time
                                .split(":")
                                .map(Number);
                              const date = new Date();
                              date.setHours(hours + 1);
                              date.setMinutes(minutes);
                              date.setSeconds(seconds || 0);
                              return date.toLocaleTimeString("en-US", {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              });
                            })()}
                          </span>
                          {(isPending
                            ? state.pending?.new_note
                            : income.note) && (
                            <span className="text-[10px] text-zinc-400 italic truncate max-w-[120px]">
                              {isPending
                                ? state.pending?.new_note
                                : income.note}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPending && (
                            <>
                              <button
                                onClick={() => setViewingIncome(income)}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingIncome(income)}
                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingIncome(income)}
                                className="p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isPending && (
                            <>
                              <button
                                disabled={processingId === state.pending?.id}
                                onClick={() =>
                                  handleAction(state.pending, "APPROVED")
                                }
                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all border border-emerald-200 shadow-sm flex items-center gap-1"
                                title="Approve Change"
                              >
                                {processingId === state.pending?.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                <span className="text-[10px] font-bold">
                                  Approve
                                </span>
                              </button>
                              <button
                                disabled={processingId === state.pending?.id}
                                onClick={() =>
                                  handleAction(state.pending, "REJECTED")
                                }
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                                title="Reject Change"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
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
      {viewingIncome && (
        <ViewIncomeModal
          income={viewingIncome}
          onClose={() => setViewingIncome(null)}
        />
      )}

      {editingIncome && (
        <AdminEditIncomeModal
          income={editingIncome}
          onClose={() => setEditingIncome(null)}
        />
      )}

      <CustomDialog
        isOpen={!!deletingIncome}
        onClose={() => setDeletingIncome(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        description={`Are you sure you want to delete this record for ${deletingIncome?.profiles?.name}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
