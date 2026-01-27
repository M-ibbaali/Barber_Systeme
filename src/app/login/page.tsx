"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Scissors, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Auth middleware will handle redirection, but we can also do it here for better UX
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        setError("Your account is inactive. Please contact the administrator.");
        setLoading(false);
        return;
      }

      if (profile?.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/barber");
      }
    }
  };

  const urlError = searchParams.get("error");

  const displayError =
    error ||
    (urlError === "inactive_account"
      ? "Your account is deactivated."
      : urlError === "invalid_role"
        ? "Unauthorized access."
        : null);

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-zinc-200 shadow-xl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
          <Scissors className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          Barber System
        </h1>
        <p className="mt-2 text-zinc-500">Sign in to your account</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {displayError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center font-medium">
            {displayError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-zinc-700 mb-1.5"
              htmlFor="email"
            >
              Email address
            </label>
            <input
              {...register("email")}
              id="email"
              type="email"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-zinc-400"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium text-zinc-700 mb-1.5"
              htmlFor="password"
            >
              Password
            </label>
            <input
              {...register("password")}
              id="password"
              type="password"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-zinc-400"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full group relative flex justify-center py-3.5 px-4 border border-transparent font-semibold rounded-xl text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
