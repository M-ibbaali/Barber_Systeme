"use client";

import { X, Calendar, Clock, DollarSign, User, FileText } from "lucide-react";

export default function ViewIncomeModal({
  income,
  onClose,
}: {
  income: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/30">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              Income Details
            </h2>
            <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">
              View confirmed record
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold shrink-0">
              {income.profiles?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Barber
              </p>
              <p className="text-zinc-900 font-bold">{income.profiles?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Amount
              </label>
              <p className="text-xl font-black text-zinc-900">
                {income.amount.toFixed(2)} DH
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </label>
              <p className="text-xl font-black text-zinc-900">{income.time}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Created At
            </label>
            <p className="text-sm font-bold text-zinc-700 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
              {new Date(income.created_at).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {income.note && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <FileText className="w-3 h-3" /> Note
              </label>
              <p className="text-sm font-medium text-zinc-600 bg-zinc-50 px-4 py-3 rounded-2xl border border-zinc-100 italic">
                "{income.note}"
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-4 px-4 rounded-2xl font-black bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
