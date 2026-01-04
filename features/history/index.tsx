"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, SatpamAttendanceHistoryItem } from "@/lib/types";
import { clearToken } from "@/lib/auth";

function defaultRange() {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);
  const start = startDate.toISOString().slice(0, 10);
  return { start, end };
}

export default function HistoryPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const { start, end } = defaultRange();
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [items, setItems] = useState<SatpamAttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (s: string, e: string) => {
    setLoading(true);
    setError(null);
    try {
      const qs = `?start_date=${s}&end_date=${e}`;
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
        err instanceof Error ? err.message : "Gagal memuat riwayat absensi"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    load(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const applyFilter = () => {
    if (!startDate || !endDate) return;
    load(startDate, endDate);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center ">
        <p className="text-sm text-slate-300">Memuat...</p>
      </div>
    );
  }

  // Sembunyikan hari dengan shift Libur dari riwayat absensi.
  const visibleItems = items.filter(
    (item) =>
      !(
        item.shift &&
        item.shift.name &&
        item.shift.name.toLowerCase() === "libur"
      )
  );

  return (
    <div className="flex min-h-screen flex-col  ">
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => router.back()} className="text-xs">
          &larr; Kembali
        </button>
        <h1 className="text-sm font-semibold">Riwayat Absensi</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-2xl bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Filter Tanggal</h2>
              <p className="text-[11px] text-slate-300">
                Pilih rentang tanggal riwayat yang ingin dilihat.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-600  px-2 py-1 text-xs "
              />
              <span className="text-[11px] text-slate-400">sampai</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-600  px-2 py-1 text-xs "
              />
              <button
                type="button"
                onClick={applyFilter}
                className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white"
              >
                Terapkan
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-xs text-slate-300">Memuat riwayat...</p>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : visibleItems.length === 0 ? (
            <p className="text-xs text-slate-300">
              Belum ada riwayat absensi pada rentang tanggal ini.
            </p>
          ) : (
            <div className="mt-2 space-y-3">
              {visibleItems.map((item) => {
                const status = item.attendance?.status ?? "NONE";
                const late = item.attendance?.late_status;
                const dateText = item.date;
                const clockIn = item.attendance?.clock_in_time;
                const clockOut = item.attendance?.clock_out_time;

                const isNightShift =
                  !!item.shift &&
                  item.shift.start_time &&
                  item.shift.end_time &&
                  item.shift.end_time < item.shift.start_time;

                return (
                  <div
                    key={`${item.date}-${item.shift?.id ?? "no-shift"}`}
                    className="rounded-xl /70 p-3 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-100">
                          {dateText}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Shift:{" "}
                          {item.shift ? (
                            <>
                              {item.shift.name} ({item.shift.start_time} -{" "}
                              {item.shift.end_time})
                            </>
                          ) : (
                            "Tidak ada shift"
                          )}
                        </p>
                        {isNightShift && (
                          <span className="mt-1 inline-flex rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                            Night shift
                          </span>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          status === "CLOCKED_OUT"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : status === "CLOCKED_IN"
                            ? "bg-sky-500/20 text-sky-200"
                            : "bg-slate-600/40 text-slate-200"
                        }`}
                      >
                        {status === "NONE" && "Belum absen"}
                        {status === "CLOCKED_IN" && "Clock-in saja"}
                        {status === "CLOCKED_OUT" && "Selesai"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-400">Jam masuk</p>
                        <p className="text-[11px] text-slate-100">
                          {clockIn
                            ? new Date(clockIn).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Jam keluar</p>
                        <p className="text-[11px] text-slate-100">
                          {clockOut
                            ? new Date(clockOut).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </p>
                      </div>
                    </div>
                    {late && (
                      <p className="mt-1 text-[10px] text-slate-300">
                        Keterlambatan: {late}
                      </p>
                    )}
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
