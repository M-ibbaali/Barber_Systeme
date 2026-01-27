"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  ShieldAlert,
  BadgeCheck,
  Loader2,
  Edit2,
  Trash2,
  X,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function BarberManager({
  initialBarbers,
  barberTotals,
}: {
  initialBarbers: any[];
  barberTotals: any;
}) {
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [newBarber, setNewBarber] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();
  const supabase = createClient();

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/admin/barbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBarber),
    });

    const result = await response.json();
    setLoading(false);

    if (response.ok) {
      setShowAdd(false);
      setNewBarber({ name: "", email: "", password: "" });
      router.refresh();
      alert("Barber account created successfully!");
    } else {
      const errorMsg = result.error || "An unknown error occurred";
      const errorCode = result.code ? ` [${result.code}]` : "";
      const diagnostic = result.diagnostic
        ? `\n\nDiagnostic: ${JSON.stringify(result.diagnostic, null, 2)}`
        : "";
      alert(`Error: ${errorMsg}${errorCode}${diagnostic}`);
      console.error("Barber creation failed. Full response:", result);
    }
  };

  const handleUpdateBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber) return;
    setLoading(true);

    const response = await fetch(`/api/admin/barbers/${editingBarber.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingBarber.name,
        email: editingBarber.email,
        // Password is only included if not empty
        ...(editingBarber.newPassword && {
          password: editingBarber.newPassword,
        }),
      }),
    });

    const result = await response.json();
    setLoading(true);

    if (response.ok) {
      setEditingBarber(null);
      router.refresh();
      setLoading(false);
      alert("Barber updated successfully!");
    } else {
      setLoading(false);
      alert(`Error: ${result.error}`);
    }
  };

  const handleDeleteBarber = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete ${name}? This action cannot be undone and will delete all their income records.`,
      )
    )
      return;

    setLoading(true);
    const response = await fetch(`/api/admin/barbers/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.refresh();
      alert("Barber deleted successfully.");
    } else {
      const result = await response.json();
      alert(`Error: ${result.error}`);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) router.refresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden h-full shadow-sm">
      <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
        <h2 className="text-xl font-bold text-zinc-900">Barbers</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          <UserPlus className="w-4 h-4" />
          {showAdd ? "Close" : "Add"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddBarber}
          className="p-4 sm:p-6 border-b border-zinc-200 bg-zinc-50/30 space-y-4 animate-in slide-in-from-top-2"
        >
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Create New Barber
          </h3>
          <div>
            <input
              value={newBarber.name}
              onChange={(e) =>
                setNewBarber({ ...newBarber, name: e.target.value })
              }
              placeholder="Name"
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-1 ring-amber-500 outline-none text-zinc-900"
              required
            />
          </div>
          <div>
            <input
              value={newBarber.email}
              onChange={(e) =>
                setNewBarber({ ...newBarber, email: e.target.value })
              }
              placeholder="Email"
              type="email"
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-1 ring-amber-500 outline-none text-zinc-900"
              required
            />
          </div>
          <div>
            <input
              value={newBarber.password}
              onChange={(e) =>
                setNewBarber({ ...newBarber, password: e.target.value })
              }
              placeholder="Password"
              type="password"
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-1 ring-amber-500 outline-none text-zinc-900"
              required
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-black py-3 sm:py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-zinc-900/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      )}

      {/* Edit Modal / Area */}
      {editingBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Edit Barber</h2>
              <button
                onClick={() => setEditingBarber(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleUpdateBarber} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Name
                </label>
                <input
                  value={editingBarber.name}
                  onChange={(e) =>
                    setEditingBarber({ ...editingBarber, name: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:ring-1 ring-amber-500 outline-none mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Email
                </label>
                <input
                  value={editingBarber.email}
                  onChange={(e) =>
                    setEditingBarber({
                      ...editingBarber,
                      email: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:ring-1 ring-amber-500 outline-none mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  New Password (leave empty to keep same)
                </label>
                <input
                  value={editingBarber.newPassword || ""}
                  onChange={(e) =>
                    setEditingBarber({
                      ...editingBarber,
                      newPassword: e.target.value,
                    })
                  }
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:ring-1 ring-amber-500 outline-none mt-1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBarber(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-amber-500/20"
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
      )}

      <div className="divide-y divide-zinc-100">
        {initialBarbers.map((barber) => (
          <div
            key={barber.id}
            className="p-4 hover:bg-zinc-50 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${barber.is_active ? "border-green-500 text-green-500 bg-green-50" : "border-zinc-200 text-zinc-400 bg-zinc-100"}`}
                >
                  {barber.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2 text-zinc-900">
                    {barber.name}
                    {!barber.is_active && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Total: {barberTotals[barber.id]?.toFixed(2) || "0.00"} DH
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 transition-opacity">
                <button
                  onClick={() => setEditingBarber({ ...barber })}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                  title="Edit Barber"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleStatus(barber.id, barber.is_active)}
                  className={`p-2 rounded-lg transition-colors ${barber.is_active ? "text-green-500 hover:bg-green-50" : "text-zinc-400 hover:bg-zinc-100"}`}
                  title={barber.is_active ? "Deactivate" : "Activate"}
                >
                  {barber.is_active ? (
                    <BadgeCheck className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => handleDeleteBarber(barber.id, barber.name)}
                  className="p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
