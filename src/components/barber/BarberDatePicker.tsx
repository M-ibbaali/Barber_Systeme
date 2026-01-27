"use client";

import { Calendar as CalendarIcon } from "lucide-react";

export default function BarberDatePicker({
  defaultValue,
}: {
  defaultValue: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl focus-within:ring-1 ring-amber-500 transition-all w-full sm:w-auto">
      <CalendarIcon className="w-4 h-4 text-zinc-400 shrink-0" />
      <input
        type="date"
        defaultValue={defaultValue}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("date", e.target.value);
          window.location.href = url.toString();
        }}
        className="bg-transparent text-sm outline-none text-zinc-900 w-full cursor-pointer font-bold"
      />
    </div>
  );
}
