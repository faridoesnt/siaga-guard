"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, SatpamDashboard, Attendance, SatpamDashboardShift, LateStatus } from "@/lib/types";
import { clearToken, setTodayAttendanceId } from "@/lib/auth";
import {
  CalendarClock,
  CalendarRange,
  CalendarSync,
  ImageUp,
} from "lucide-react";
import ClockInCard from "@/features/clockIn";
import ClockOutCard from "@/features/clockout";

export default function DashboardPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<SatpamDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clockInLoading, setClockInLoading] = useState(false);
  const [clockInError, setClockInError] = useState<string | null>(null);

  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [clockOutError, setClockOutError] = useState<string | null>(null);

  const [cameraMode, setCameraMode] = useState<"clock-in" | "clock-out" | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [clockOutPhotoBlob, setClockOutPhotoBlob] = useState<Blob | null>(null);
  const [clockOutPhotoTaken, setClockOutPhotoTaken] = useState(false);

  useEffect(() => {
    if (!cameraMode) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          // ignore autoplay errors
        });
      }
    }
  }, [cameraMode]);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        const dashResp = await apiFetch<SatpamDashboard>(
          `/v1/satpam/dashboard?date=${dateStr}`
        );
        setDashboard(dashResp);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  const status = dashboard?.attendance?.status ?? "NONE";

  const canClockIn =
    !!dashboard?.can_clock_in && !clockInLoading && !clockOutLoading;
  const canClockOut =
    !!dashboard?.can_clock_out && !clockOutLoading && !clockInLoading;

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraMode(null);
    setClockOutPhotoBlob(null);
    setClockOutPhotoTaken(false);
  };

  const openCameraForClockIn = async () => {
    setClockInError(null);
    setClockOutError(null);
    setClockOutPhotoBlob(null);
    setClockOutPhotoTaken(false);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setClockInError("Perangkat tidak mendukung kamera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraMode("clock-in");
    } catch (err) {
      setClockInError(
        err instanceof Error
          ? "Tidak dapat mengakses kamera: " + err.message
          : "Tidak dapat mengakses kamera."
      );
    }
  };

  const openCameraForClockOut = async () => {
    setClockOutError(null);
    setClockInError(null);
    setClockOutPhotoBlob(null);
    setClockOutPhotoTaken(false);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setClockOutError("Perangkat tidak mendukung kamera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraMode("clock-out");
    } catch (err) {
      setClockOutError(
        err instanceof Error
          ? "Tidak dapat mengakses kamera: " + err.message
          : "Tidak dapat mengakses kamera."
      );
    }
  };

  const captureImageBase64 = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const [, base64] = dataUrl.split(",");
    return base64 || null;
  };

  const captureClockOutPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setClockOutPhotoBlob(blob);
          setClockOutPhotoTaken(true);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleClockIn = async () => {
    setClockInError(null);
    setClockInLoading(true);
    try {
      const imageBase64 = captureImageBase64();
      if (!imageBase64) {
        setClockInError("Gagal mengambil gambar dari kamera.");
        setClockInLoading(false);
        return;
      }

      let position: GeolocationPosition;
      try {
        position = await getCurrentPosition();
      } catch (err) {
        setClockInError(
          err instanceof Error
            ? "Lokasi tidak tersedia: " + err.message
            : "Lokasi tidak tersedia."
        );
        setClockInLoading(false);
        return;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const attendance = await apiFetch<Attendance>(
        "/v1/satpam/attendance/clock-in",
        {
          method: "POST",
          body: JSON.stringify({
            lat,
            lng,
            image_base64: imageBase64,
          }),
        }
      );

      setTodayAttendanceId(attendance.id);

      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const dashResp = await apiFetch<SatpamDashboard>(
        `/v1/satpam/dashboard?date=${dateStr}`
      );
      setDashboard(dashResp);
      stopStream();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError) {
        setClockInError(err.message || "Clock in gagal.");
      } else {
        console.error(err);
        setClockInError("Clock in gagal. Silakan coba lagi.");
      }
    } finally {
      setClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockOutError(null);
    if (!clockOutPhotoBlob) {
      setClockOutError("Foto belum diambil.");
      return;
    }
    setClockOutLoading(true);
    try {
      let position: GeolocationPosition;
      try {
        position = await getCurrentPosition();
      } catch (err) {
        setClockOutError(
          err instanceof Error
            ? "Lokasi tidak tersedia: " + err.message
            : "Lokasi tidak tersedia."
        );
        setClockOutLoading(false);
        return;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const form = new FormData();
      form.append("lat", String(lat));
      form.append("lng", String(lng));
      form.append(
        "photo",
        new File([clockOutPhotoBlob], "clock-out.jpg", {
          type: "image/jpeg",
        })
      );

      await apiFetch<Attendance>("/v1/satpam/attendance/clock-out", {
        method: "POST",
        body: form,
      });

      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10);
      const dashResp = await apiFetch<SatpamDashboard>(
        `/v1/satpam/dashboard?date=${dateStr}`
      );
      setDashboard(dashResp);
      stopStream();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError) {
        setClockOutError(err.message || "Clock out gagal.");
      } else {
        console.error(err);
        setClockOutError("Clock out gagal. Silakan coba lagi.");
      }
    } finally {
      setClockOutLoading(false);
    }
  };

  const shift = dashboard?.shift || null;
  const isLiburShift = !!shift && shift.name.toLowerCase() === "libur";

  const lateStatus = dashboard?.attendance?.late_status;
  const clockInTime = dashboard?.attendance?.clock_in_time || null;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-50">
        <p className="text-sm text-slate-300">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <main className="flex-1 space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-2xl bg-white p-4">
          {loading ? (
            <p className="text-xs text-slate-300">Memuat dashboard...</p>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Ringkasan Hari Ini</h2>
                  <p className="text-xs text-slate-300">
                    Tanggal:{" "}
                    <span className="font-medium">
                      {dashboard?.date || "-"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {dashboard?.has_open_attendance &&
                  (() => {
                    const openClockIn =
                      dashboard.open_attendance_summary?.clock_in_time || null;
                    const dashboardDate = dashboard.date;

                    // Jika open attendance masih di tanggal yang sama dengan dashboard,
                    // anggap itu shift hari ini (normal) -> tidak perlu warning khusus.
                    if (openClockIn && dashboardDate) {
                      const dt = new Date(openClockIn);
                      if (!Number.isNaN(dt.getTime())) {
                        const openDateStr = dt.toISOString().slice(0, 10);
                        if (openDateStr === dashboardDate) {
                          return null;
                        }
                      }
                    }

                    let detail = "";
                    if (openClockIn) {
                      const dt = new Date(openClockIn);
                      if (!Number.isNaN(dt.getTime())) {
                        const dateText = dt.toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });
                        const timeText = dt.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        detail = ` (clock-in pada ${dateText}, ${timeText})`;
                      }
                    }

                    return (
                      <div className="rounded-xl bg-amber-500/15 px-3 py-2 text-[11px] text-amber-50">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                          Ada absensi yang belum clock-out
                        </p>
                        <p className="mt-1 leading-snug">
                          Masih ada absensi shift sebelumnya
                          {detail}. Silakan lakukan{" "}
                          <span className="font-semibold">CLOCK OUT</span>{" "}
                          terlebih dahulu sebelum absen untuk shift hari ini.
                        </p>
                      </div>
                    );
                  })()}
                <div>
                  <span className="font-medium">Shift: </span>
                  {shift ? (
                    isLiburShift ? (
                      <span>Libur (tidak perlu absen)</span>
                    ) : (
                      <span>
                        {shift.name} ({shift.start_time} - {shift.end_time})
                      </span>
                    )
                  ) : (
                    <span>Tidak ada shift.</span>
                  )}
                </div>
                {!isLiburShift && (
                  <div>
                    <span className="font-medium">Status kehadiran: </span>
                    <span>
                      {status === "NONE" && "Belum absen"}
                      {status === "CLOCKED_IN" && "Sudah clock in"}
                      {status === "CLOCKED_OUT" && "Sudah clock out"}
                    </span>
                  </div>
                )}
                {lateStatus && (
                  <LateSummary
                    status={lateStatus}
                    date={dashboard?.date}
                    shift={dashboard?.shift || null}
                    clockInTime={clockInTime}
                  />
                )}
              </div>
            </>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <ClockInCard
            canClockIn={canClockIn}
            clockInLoading={clockInLoading}
            clockInError={clockInError}
            isOpen={cameraMode === "clock-in"}
            onOpenCamera={openCameraForClockIn}
            onClose={stopStream}
            onSubmit={handleClockIn}
            tooltipText="tidak bisa akses karena belum jadwalnya"
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
          <ClockOutCard
            canClockOut={canClockOut}
            clockOutLoading={clockOutLoading}
            clockOutError={clockOutError}
            clockOutPhotoTaken={clockOutPhotoTaken}
            isOpen={cameraMode === "clock-out"}
            onOpenCamera={openCameraForClockOut}
            onClose={stopStream}
            onCapturePhoto={captureClockOutPhoto}
            onSubmit={handleClockOut}
            tooltipText="tidak bisa akses karena belum jadwalnya"
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
          {[
            {
              key: "activity",
              label: "UPLOAD FOTO AKTIVITAS",
              icon: ImageUp,
              onClick: () => router.push("/activity"),
              tone: "bg-[#0F2A44] text-white",
              iconClass: "h-7 w-7 text-white",
            },
            {
              key: "shift-swap",
              label: "PERMINTAAN TUKAR SHIFT",
              icon: CalendarSync,
              onClick: () => router.push("/shift-swap"),
              tone: "bg-violet-500 text-slate-50",
              iconClass: "h-7 w-7",
            },
            {
              key: "schedule",
              label: "LIHAT JADWAL SHIFT",
              icon: CalendarRange,
              onClick: () => router.push("/schedule"),
              tone: "bg-slate-800 text-slate-100",
              iconClass: "h-7 w-7",
            },
            {
              key: "history",
              label: "RIWAYAT ABSENSI",
              icon: CalendarClock,
              onClick: () => router.push("/history"),
              tone: "bg-slate-800 text-slate-100",
              iconClass: "h-7 w-7",
            },
          ].map(({ key, label, icon: Icon, onClick, tone, iconClass }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              <button
                type="button"
                onClick={onClick}
                className={`flex h-16 w-16 items-center justify-center rounded-full shadow transition active:scale-95 active:shadow-inner ${tone}`}
                aria-label={label}
              >
                <Icon className={iconClass} />
              </button>
              <span className="text-[11px] font-semibold text-slate-700">
                {label}
              </span>
            </div>
          ))}
        </section>
        {(clockInError || clockOutError) && (
          <p className="text-xs text-red-400">
            {clockInError || clockOutError}
          </p>
        )}

      </main>
    </div>
  );
}

type LateSummaryProps = {
  status: LateStatus;
  date?: string | null;
  shift: SatpamDashboardShift | null;
  clockInTime?: string | null;
};

import { formatLateStatusDisplay } from "@/lib/lateStatus";

function LateSummary({ status, date, shift, clockInTime }: LateSummaryProps) {
  const text = formatLateStatusDisplay(status, date ?? null, shift, clockInTime);

  return (
    <div>
      <span className="font-medium text-slate-200">Keterlambatan: </span>
      <span>{text}</span>
    </div>
  );
}
