"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, SatpamAttendanceHistoryItem } from "@/lib/types";
import { clearToken } from "@/lib/auth";
import { formatLocalDateISO } from "@/lib/date";

function getDefaultMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function buildRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const startStr = formatLocalDateISO(start);
  const endStr = formatLocalDateISO(end);
  return { startStr, endStr };
}

export default function SchedulePage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const { month, year } = getDefaultMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [items, setItems] = useState<SatpamAttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (m: number, y: number) => {
    const { startStr, endStr } = buildRange(m, y);
    setLoading(true);
    setError(null);
    try {
      const qs = `?start_date=${startStr}&end_date=${endStr}`;
      const data = await apiFetch<SatpamAttendanceHistoryItem[]>(
        `/v1/satpam/attendance/history${qs}`
      );
      setItems(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Gagal memuat jadwal shift"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    load(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const applyFilter = () => {
    load(selectedMonth, selectedYear);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center  text-slate-50">
        <p className="text-sm ">Memuat...</p>
      </div>
    );
  }

  // Only keep days that have a shift assigned (jadwal).
  const daysWithShift = items.filter((item) => item.shift);

  return (
    <div className="flex min-h-screen flex-col  text-slate-50">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs "
        >
          <span>&larr; Kembali</span>
        </button>
        <h1 className="text-sm font-semibold">Jadwal Shift</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-2xl bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Filter Bulan</h2>
              <p className="text-[11px] ">
                Pilih bulan dan tahun jadwal shift yang ingin dilihat.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-600  px-2 py-1 text-xs text-slate-50"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-600  px-2 py-1 text-xs text-slate-50"
              />
              <button
                type="button"
                onClick={applyFilter}
                className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-slate-900"
              >
                Terapkan
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-xs ">Memuat jadwal...</p>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : daysWithShift.length === 0 ? (
            <p className="text-xs ">Belum ada jadwal shift pada bulan ini.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {daysWithShift.map((item) => {
                const shift = item.shift!;
                const isLibur =
                  shift.name && shift.name.toLowerCase() === "libur";
                const isNightShift =
                  !!shift.start_time &&
                  !!shift.end_time &&
                  shift.end_time < shift.start_time;

                return (
                  <div
                    key={`${item.date}-${shift.id}`}
                    className="rounded-xl /70 p-3 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-100">
                          {item.date}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Shift:{" "}
                          {isLibur
                            ? "Libur"
                            : `${shift.name} (${shift.start_time} - ${shift.end_time})`}
                        </p>
                        {isNightShift && !isLibur && (
                          <span className="mt-1 inline-flex rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                            Night shift
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
