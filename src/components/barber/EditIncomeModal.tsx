"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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

export default function EditIncomeModal({
  income,
  onClose,
}: {
  income: any;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

    const { error } = await supabase
      .from("incomes")
      .update({
        amount: Number(data.amount),
        note: data.note || null,
      })
      .eq("id", income.id);

    setLoading(false);
    if (!error) {
      onClose();
      router.refresh();
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/30">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              Edit Income
            </h2>
            <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">
              Update record details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
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
              Sale Amount (DH)
            </label>
            <input
              {...register("amount")}
              type="text"
              inputMode="decimal"
              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all text-2xl sm:text-3xl font-black placeholder:text-zinc-200"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1">
                <X className="w-3 h-3" />
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              Quick Note
            </label>
            <input
              {...register("note")}
              placeholder="Haircut, Beard, etc..."
              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-900 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold placeholder:text-zinc-400 text-sm sm:text-base"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-4 px-4 rounded-2xl font-black bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-[2] py-4 px-4 rounded-2xl font-black bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 order-1 sm:order-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
