"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Camera, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage({ profile }: { profile: any }) {
  const [name, setName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // 1. Update Profile Data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name, avatar_url: avatarUrl })
      .eq("id", profile.id);

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    // 2. Update Password if provided
    if (password) {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        setLoading(false);
        return;
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) {
        alert(passwordError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSuccess(true);
    setPassword("");
    setConfirmPassword("");
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Immediate save to profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      alert("Failed to save profile photo: " + updateError.message);
      setLoading(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/barber"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <div className="p-2 rounded-full border border-zinc-200 group-hover:bg-zinc-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">
            Back to Dashboard
          </span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-amber-400 to-amber-600 relative">
          <div className="absolute  left-8 mt-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-2xl overflow-hidden ring-4 ring-white/50">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-xl bg-zinc-100"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center rounded-xl border-2 border-zinc-100 border-dashed">
                    <User className="w-8 h-8 text-zinc-300" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute -right-3 -bottom-3 p-2.5 rounded-xl bg-zinc-900 text-white shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 ring-4 ring-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="pt-28 p-4 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              Profile Settings
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage your public information and avatar
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 font-medium focus:ring-2 ring-amber-500/20 outline-none transition-all"
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  Email Address
                </span>
                <span className="text-zinc-400 italic">Pre-verified</span>
              </div>
              <p className="text-zinc-800 font-medium">
                {profile?.email || "N/A"}
              </p>
            </div>

            {profile?.role === "admin" && (
              <div className="pt-4 border-t border-zinc-100 space-y-4">
                <h3 className="text-sm font-black text-zinc-900">
                  Change Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:ring-2 ring-amber-500/20 outline-none transition-all placeholder:text-zinc-300"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:ring-2 ring-amber-500/20 outline-none transition-all placeholder:text-zinc-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-zinc-900 text-white font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-900/10 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
              {success && (
                <div className="flex-[1] flex items-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-left-2 transition-all">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Saved!</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
