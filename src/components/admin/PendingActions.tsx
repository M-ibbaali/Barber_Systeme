"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, AlertCircle, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PendingActions({
  requests,
  barbers,
}: {
  requests: any[];
  barbers: any[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getBarberName = (id: string) =>
    barbers.find((b) => b.id === id)?.name || "Unknown";

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

      // Update request status regardless of action (Approved or Rejected)
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

  if (requests.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-zinc-200 bg-amber-50/50 flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Pending Actions ({requests.length})
        </h2>
      </div>

      <div className="divide-y divide-zinc-100">
        {requests.map((req) => (
          <div key={req.id} className="p-6 hover:bg-zinc-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">
                    {getBarberName(req.barber_id)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      req.action_type === "DELETE"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {req.action_type}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100/50">
                    <Clock className="w-3 h-3" />
                    {(() => {
                      const rawDate = req.created_at || req.requested_at;
                      if (!rawDate) return "Just now";

                      try {
                        const date = new Date(
                          new Date(rawDate).getTime() + 60 * 60 * 1000,
                        );
                        if (isNaN(date.getTime())) return "Recent";

                        return (
                          <>
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            •{" "}
                            {date.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </>
                        );
                      } catch (e) {
                        return "Just now";
                      }
                    })()}
                  </span>
                </div>

                <div className="text-sm text-zinc-500">
                  {req.action_type === "UPDATE" ? (
                    <div className="flex items-center gap-2 text-base">
                      <span className="line-through text-zinc-300 font-medium">
                        {req.old_amount.toFixed(2)} DH
                      </span>
                      <span className="text-zinc-400">→</span>
                      <span className="font-bold text-zinc-900">
                        {req.new_amount.toFixed(2)} DH
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-600">
                      Requested to delete record:{" "}
                      <span className="font-bold">
                        {req.old_amount.toFixed(2)} DH
                      </span>
                    </span>
                  )}
                </div>

                {req.new_note && req.new_note !== req.old_note && (
                  <p className="text-xs text-zinc-400 italic">
                    New note: "{req.new_note}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={processingId === req.id}
                  onClick={() => handleAction(req, "APPROVED")}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
                >
                  {processingId === req.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve
                </button>
                <button
                  disabled={processingId === req.id}
                  onClick={() => handleAction(req, "REJECTED")}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
