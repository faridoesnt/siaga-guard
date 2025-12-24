"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, SatpamPeer, ShiftSwapRequest } from "@/lib/types";
import { clearToken } from "@/lib/auth";

export default function ShiftSwapPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [requests, setRequests] = useState<ShiftSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesError, setDatesError] = useState<string | null>(null);

  const [targetUserId, setTargetUserId] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [reason, setReason] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [peers, setPeers] = useState<SatpamPeer[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [peersError, setPeersError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<ShiftSwapRequest[]>(
          `/v1/satpam/shift-swap-requests`
        );
        setRequests(data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat permintaan tukar shift"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  useEffect(() => {
    if (!ready) return;
    const loadDates = async () => {
      setDatesLoading(true);
      setDatesError(null);
      try {
        const data = await apiFetch<string[]>(
          "/v1/satpam/shift-swap-dates"
        );
        setAvailableDates(data);
        if (!shiftDate && data.length > 0) {
          const first = data[0];
          setShiftDate(first);
          void loadPeers(first);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        setDatesError(
          err instanceof Error
            ? err.message
            : "Gagal memuat tanggal shift"
        );
      } finally {
        setDatesLoading(false);
      }
    };
    loadDates();
  }, [ready, router]);

  const loadPeers = async (date: string) => {
    if (!date) {
      setPeers([]);
      setPeersError(null);
      return;
    }
    setPeersLoading(true);
    setPeersError(null);
    try {
      const data = await apiFetch<SatpamPeer[]>(
        `/v1/satpam/shift-swap-peers?date=${date}`
      );
      setPeers(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      setPeersError(
        err instanceof Error
          ? err.message
          : "Gagal memuat daftar satpam untuk tanggal tersebut"
      );
    } finally {
      setPeersLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreating(true);
    try {
      await apiFetch("/v1/satpam/shift-swap-requests", {
        method: "POST",
        body: JSON.stringify({
          target_user_id: targetUserId,
          shift_date: shiftDate,
          reason,
        }),
      });
      setCreateSuccess("Shift successfully swapped. Admin has been notified.");
      setTargetUserId("");
      setShiftDate("");
      setReason("");
      const data = await apiFetch<ShiftSwapRequest[]>(
        `/v1/satpam/shift-swap-requests`
      );
      setRequests(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      setCreateError(
        err instanceof Error
          ? err.message
          : "Gagal membuat permintaan tukar shift"
      );
    } finally {
      setCreating(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-50">
        <p className="text-sm text-slate-300">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-50">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-slate-200"
        >
          &larr; Kembali
        </button>
        <h1 className="text-sm font-semibold">Tukar Shift</h1>
        <div className="w-8" />
      </header>
      <main className="flex-1 space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-2xl bg-slate-800/80 p-4">
          <h2 className="mb-3 text-xs font-semibold text-slate-200">
            Buat Permintaan Tukar Shift
          </h2>
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="mb-1 block font-medium text-slate-200">
                Tanggal Shift
              </label>
              <select
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-slate-500 focus:ring-2 disabled:opacity-60"
                value={shiftDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setShiftDate(d);
                  setTargetUserId("");
                  void loadPeers(d);
                }}
                disabled={datesLoading || availableDates.length === 0}
              >
                <option value="">
                  {datesLoading
                    ? "Memuat tanggal shift..."
                    : availableDates.length === 0
                    ? "Tidak ada shift yang bisa ditukar"
                    : "Pilih tanggal shift"}
                </option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {datesError && (
                <p className="mt-1 text-[11px] text-red-400">{datesError}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-200">
                Satpam Target
              </label>
              <select
                required
                disabled={!shiftDate || peersLoading || peers.length === 0}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-slate-500 focus:ring-2 disabled:opacity-60"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">
                  {shiftDate
                    ? peersLoading
                      ? "Memuat satpam..."
                      : "Pilih satpam target"
                    : "Pilih tanggal shift terlebih dahulu"}
                </option>
                {peers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
              {peersError && (
                <p className="mt-1 text-[11px] text-red-400">{peersError}</p>
              )}
              {shiftDate && !peersLoading && !peersError && peers.length === 0 && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Tidak ada satpam lain yang memiliki shift pada tanggal ini.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-200">
                Alasan
              </label>
              <textarea
                className="h-20 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-slate-500 placeholder:text-slate-500 focus:ring-2"
                placeholder="Tuliskan alasan tukar shift"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {createError && (
              <p className="text-xs text-red-400">{createError}</p>
            )}
            {createSuccess && (
              <p className="text-xs text-emerald-400">{createSuccess}</p>
            )}
            <button
              type="submit"
              disabled={creating || !shiftDate || !targetUserId}
              className="mt-1 flex w-full items-center justify-center rounded-2xl bg-violet-500 px-4 py-3 text-center text-sm font-semibold text-slate-50 shadow disabled:opacity-60"
            >
              {creating ? "Mengirim..." : "KIRIM PERMINTAAN"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-slate-800/80 p-4 text-xs">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-200">
              Riwayat Permintaan
            </h2>
          </div>
          {loading ? (
            <p className="text-slate-300">Memuat...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : requests.length === 0 ? (
            <p className="text-slate-400">Belum ada permintaan.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-300">
                      Tanggal shift:{" "}
                      <span className="font-medium">
                        {r.shift_date.slice(0, 10)}
                      </span>
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300"
                          : r.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="mt-1 text-[11px] text-slate-300">
                      Alasan: {r.reason}
                    </p>
                  )}
                  {r.note && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Catatan CS: {r.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
