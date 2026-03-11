"use client";

import { createClient } from "@/lib/supabase/client";
import { Trash2, Edit2, Clock, StickyNote } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import EditIncomeModal from "./EditIncomeModal";
import CustomDialog from "../ui/CustomDialog";
import { useTranslations } from "next-intl";
import { parseDatabaseTime } from "@/lib/utils/date";

export default function IncomeList({
  initialIncomes,
}: {
  initialIncomes: any[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "confirm" | "danger" | "warning" | "success" | "info";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info",
  });
  const t = useTranslations("IncomeList");
  const commonT = useTranslations("Common");

  const handleDelete = async (id: string) => {
    setDialog({
      isOpen: true,
      title: "Delete Record?",
      description:
        "Are you sure you want to delete this record? A request will be sent to the administrator for approval.",
      type: "danger",
      onConfirm: () => executeDelete(id),
    });
  };

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    setDialog((prev) => ({ ...prev, isOpen: false }));

    // 1. Check if a request is already pending for this income
    const { data: existingPending } = await supabase
      .from("income_requests")
      .select("id")
      .eq("income_id", id)
      .eq("status", "PENDING")
      .single();

    if (existingPending) {
      setDialog({
        isOpen: true,
        title: t("requestPendingTitle"),
        description: t("requestPendingDesc"),
        type: "warning",
      });
      setDeletingId(null);
      return;
    }

    const income = initialIncomes.find((i) => i.id === id);

    const { error } = await supabase.from("income_requests").insert({
      income_id: id,
      barber_id: income.barber_id,
      action_type: "DELETE",
      old_amount: income.amount,
      old_note: income.note,
      status: "PENDING",
    });

    if (error) {
      setDialog({
        isOpen: true,
        title: t("errorTitle"),
        description: error.message,
        type: "danger",
      });
      setDeletingId(null);
    } else {
      router.refresh();
    }
  };

  if (initialIncomes.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-500">{t("noRecords")}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {initialIncomes.map((income) => (
        <div
          key={income.id}
          className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {Number(income.amount).toFixed(2)} DH
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    {parseDatabaseTime(income.time)}
                  </span>
                </div>
                {income.note && (
                  <div className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                    <StickyNote className="w-4 h-4 mt-0.5 shrink-0 text-zinc-300" />
                    <p className="truncate italic">{income.note}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingIncome(income)}
                className="p-2 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                title={commonT("edit")}
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(income.id)}
                disabled={deletingId === income.id}
                className="p-2 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-50"
                title={commonT("delete")}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingIncome && (
        <EditIncomeModal
          income={editingIncome}
          onClose={() => setEditingIncome(null)}
        />
      )}

      <CustomDialog
        {...dialog}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
