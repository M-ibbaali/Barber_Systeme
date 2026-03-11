"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CustomDialog from "../ui/CustomDialog";
import { Plus, X, Loader2, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
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
  image_url: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

import { useTranslations } from "next-intl";

export default function AddIncomeForm({
  barberId,
}: {
  barberId: string | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("AddIncomeForm");
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
  });

  // We should enforce validation inside onSubmit, but since we use Zod we cannot dynamically translate Zod error messages easily here unless we pass the custom message over, or just check errors.amount in JSX.

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (data: IncomeFormValues) => {
    if (!barberId) return;
    setLoading(true);

    let imageUrl = null;
    if (imageFile) {
      setIsUploading(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${barberId}-${Date.now()}.${fileExt}`;
      const filePath = `income-photos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("income-photos")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        // We continue even if upload fails as per requirement: "insert of the incom passed dont required to this input"
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("income-photos")
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
      setIsUploading(false);
    }

    const { error } = await supabase.from("incomes").insert({
      barber_id: barberId,
      amount: Number(data.amount),
      note: data.note || null,
      image_url: imageUrl,
    });

    setLoading(false);
    if (!error) {
      setIsOpen(false);
      reset();
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
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl transition-all shadow-sm active:scale-95 flex-shrink-0 text-sm"
      >
        <Plus className="w-4 h-4" />
        {t("addRecord")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-800/30">
              <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {t("newIncome")}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">
                  {t("autoSetToday")}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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
                  placeholder="250.00"
                  autoFocus
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
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex justify-between items-center">
                  {t("photoOptional")}
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-[10px]">{t("removePhoto")}</span>
                    </button>
                  )}
                </label>
                
                <div className="relative group">
                  {imagePreview ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-amber-500/20 shadow-inner bg-zinc-50 dark:bg-zinc-800">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/30 transition-all active:scale-90">
                          <Camera className="w-6 h-6" />
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:border-amber-500/50 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300 mb-3 border border-zinc-100 dark:border-zinc-800">
                          <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                        </div>
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                          {t("attachPhoto")}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-tight">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
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
                  onClick={() => setIsOpen(false)}
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
                    commonT("confirm")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomDialog
        {...dialog}
        onClose={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
