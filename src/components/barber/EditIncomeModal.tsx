"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CustomDialog from "../ui/CustomDialog";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const incomeSchema = z.object({
  amount: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Must be a positive number",
    ),
  note: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

import { useTranslations } from "next-intl";

export default function EditIncomeModal({
  income,
  onClose,
}: {
  income: any;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("EditIncomeModal");
  const commonT = useTranslations("Common");
  const supabase = createClient();
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "confirm" | "danger" | "warning" | "success" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "info",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: income.amount.toString(),
      note: income.note || "",
    },
  });

  const onSubmit = async (data: IncomeFormValues) => {
    setLoading(true);

    // 1. Check if a request is already pending for this income
    const { data: existingPending } = await supabase
      .from("income_requests")
      .select("id")
      .eq("income_id", income.id)
      .eq("status", "PENDING")
      .single();

    if (existingPending) {
      setDialog({
        isOpen: true,
        title: t("requestPendingTitle"),
        description: t("requestPendingDesc"),
        type: "warning",
      });
      setLoading(false);
      return;
    }

    // 2. Insert the request
    const { error } = await supabase.from("income_requests").insert({
      income_id: income.id,
      barber_id: income.barber_id,
      action_type: "UPDATE",
      old_amount: income.amount,
      new_amount: Number(data.amount),
      old_note: income.note,
      new_note: data.note || null,
      status: "PENDING",
    });

    setLoading(false);
    if (!error) {
      onClose();
      router.refresh();
    } else {
      setDialog({
        isOpen: true,
        title: t("errorTitle"),
        description: error.message,
        type: "danger",
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-800/30">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {t("editIncome")}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">
                {t("updateDetails")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {t("saleAmount")}
              </label>
              <input
                {...register("amount")}
                type="text"
                inputMode="decimal"
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all text-2xl sm:text-3xl font-black placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1">
                  <X className="w-3 h-3" />
                  {errors.amount.message === "Must be a positive number"
                    ? t("mustBePositive")
                    : errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {t("quickNote")}
              </label>
              <input
                {...register("note")}
                placeholder={t("quickNotePlaceholder")}
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm sm:text-base"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 py-4 px-4 rounded-2xl font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors order-2 sm:order-1"
              >
                {commonT("cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-[2] py-4 px-4 rounded-2xl font-black bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 order-1 sm:order-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  commonT("save")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CustomDialog
        {...dialog}
        onClose={() => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          if (dialog.type === "warning") onClose(); // Close modal if pending exists
        }}
      />
    </>
  );
}
