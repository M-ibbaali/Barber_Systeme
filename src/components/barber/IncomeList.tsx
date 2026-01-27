"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2, Edit2, Clock, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function IncomeList({
  initialIncomes,
}: {
  initialIncomes: any[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    setDeletingId(id);
    const { error } = await supabase.from("incomes").delete().eq("id", id);

    if (error) {
      alert(error.message);
      setDeletingId(null);
    } else {
      router.refresh();
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr.split(".")[0];
  };

  if (initialIncomes.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-500">No records for today yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100">
      {initialIncomes.map((income) => (
        <div
          key={income.id}
          className="p-6 hover:bg-zinc-50 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-bold text-zinc-900">
                  {Number(income.amount).toFixed(2)} DH
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {formatTime(income.time)}
                </span>
              </div>
              {income.note && (
                <div className="flex items-start gap-2 text-zinc-500 text-sm">
                  <StickyNote className="w-4 h-4 mt-0.5 shrink-0 text-zinc-300" />
                  <p className="truncate italic">{income.note}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(income.id)}
                disabled={deletingId === income.id}
                className="p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                title="Delete Record"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
