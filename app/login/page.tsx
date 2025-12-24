"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiResponse, LoginResponse } from "@/lib/types";
import { isAuthenticated, setToken, setStoredUser } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload =
        (await res.json()) as ApiResponse<LoginResponse | undefined>;

      if (!res.ok || !payload.success || !payload.data) {
        setError(payload.error?.message || "Login gagal");
        setLoading(false);
        return;
      }

      if (payload.data.user.role !== "SATPAM") {
        setError("Hanya satpam yang dapat masuk ke aplikasi ini.");
        setLoading(false);
        return;
      }

      setToken(payload.data.access_token);
      setStoredUser({
        id: payload.data.user.id,
        email: payload.data.user.email,
        name: payload.data.user.name,
        role: payload.data.user.role,
      });
      router.replace("/dashboard");
    } catch (err) {
      setError("Tidak dapat login. Periksa koneksi dan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-16">
        <div className="w-full max-w-sm rounded-2xl bg-slate-800/80 px-5 py-6 shadow-lg">
          <h1 className="mb-1 text-center text-xl font-semibold tracking-tight">
            SIAGA Guard
          </h1>
          <p className="mb-6 text-center text-xs text-slate-300">
            Portal kehadiran satpam
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-slate-500 placeholder:text-slate-400 focus:ring-2"
                placeholder="guard@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-slate-500 placeholder:text-slate-400 focus:ring-2"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-xs text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Aplikasi ini membutuhkan akses kamera dan lokasi.</p>
        </div>
      </div>
    </div>
  );
}

