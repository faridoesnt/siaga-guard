"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { apiFetch } from "@/lib/apiClient";
import { ApiError, SatpamDashboard } from "@/lib/types";
import { clearToken, getTodayAttendanceId } from "@/lib/auth";

export default function ActivityPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<SatpamDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        const dash = await apiFetch<SatpamDashboard>(
          `/v1/satpam/dashboard?date=${dateStr}`
        );
        setDashboard(dash);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat informasi kehadiran"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, router]);

  const attendanceId = getTodayAttendanceId();
  const status = dashboard?.attendance?.status ?? "NONE";
  const canUpload = attendanceId && status === "CLOCKED_IN";

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!canUpload) {
      setSubmitError("Anda harus clock in hari ini sebelum mengunggah foto.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setSubmitError("Perangkat tidak mendukung kamera.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setPhotoTaken(false);
      setPhotoBlob(null);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? "Tidak dapat mengakses kamera: " + err.message
          : "Tidak dapat mengakses kamera."
      );
    }
  };

  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {});
      }
    }
  }, [cameraOpen]);

  const capturePhoto = () => {
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
          setPhotoBlob(blob);
          setPhotoTaken(true);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleSubmit = async () => {
    if (!attendanceId || !photoBlob) {
      setSubmitError("Foto belum diambil.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setSubmitError("Perangkat tidak mendukung lokasi.");
        return;
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        }
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const form = new FormData();
      form.append("attendance_id", String(attendanceId));
      if (note.trim()) {
        form.append("note", note.trim());
      }
      form.append(
        "photo",
        new File([photoBlob], "activity.jpg", { type: "image/jpeg" })
      );
      form.append("lat", String(lat));
      form.append("lng", String(lng));

      await apiFetch("/v1/satpam/activity-photos", {
        method: "POST",
        body: form,
      });

      setSubmitSuccess("Foto aktivitas berhasil diunggah.");
      setCameraOpen(false);
      stopStream();
      setPhotoBlob(null);
      setPhotoTaken(false);
      setNote("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : "Gagal mengunggah foto."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center  ">
        <p className="text-sm text-slate-300">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col  ">
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => router.back()}>
          &larr; Kembali
        </button>
        <h1 className="text-sm font-semibold">Foto Aktivitas</h1>
        <div className="w-8" />
      </header>
      <main className="flex-1 space-y-4 px-4 pb-6 pt-2">
        <section className="rounded-2xl bg-white p-4 text-xs">
          {loading ? (
            <p className="text-slate-300">Memuat status kehadiran...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <>
              <p className="text-slate-300">
                Tanggal:{" "}
                <span className="font-medium">{dashboard?.date || "-"}</span>
              </p>
              <p className="mt-1 text-slate-300">
                Status:{" "}
                <span className="font-medium">
                  {status === "CLOCKED_IN"
                    ? "Sudah clock in"
                    : status === "CLOCKED_OUT"
                    ? "Sudah clock out"
                    : "Belum absen"}
                </span>
              </p>
              {!canUpload && (
                <p className="mt-2 text-amber-300">
                  Anda hanya dapat mengunggah foto setelah clock in hari ini.
                </p>
              )}
            </>
          )}
        </section>

        <section className="space-y-3">
          <button
            type="button"
            disabled={!canUpload || submitting}
            onClick={openCamera}
            className="flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-4 text-center text-base font-semibold text-slate-900 shadow disabled:opacity-60"
          >
            {submitting ? "Mengunggah..." : "AMBIL FOTO AKTIVITAS"}
          </button>
          <div>
            Catatan (opsional)
            <textarea
              className="h-20 w-full rounded-xl border border-slate-700 px-3 py-2 text-xs  outline-none ring-slate-500 placeholder:0 focus:ring-2"
              placeholder="Tuliskan aktivitas singkat..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {submitError && <p className="text-xs text-red-400">{submitError}</p>}
          {submitSuccess && (
            <p className="text-xs text-emerald-400">{submitSuccess}</p>
          )}
        </section>

        {cameraOpen && (
          <div className="fixed inset-0 z-20 flex flex-col bg-black/90">
            <div className="flex items-center justify-between px-4 py-3 text-white">
              Ambil foto aktivitas
              <button
                type="button"
                onClick={() => {
                  setCameraOpen(false);
                  stopStream();
                }}
                className="text-xs text-slate-200"
              >
                Tutup
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-[60vh] max-h-[480px] w-full max-w-sm rounded-2xl bg-black object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <button
                type="button"
                onClick={capturePhoto}
                className="mt-4 flex w-full max-w-sm items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-base font-semibold text-slate-900 shadow"
              >
                {photoTaken ? "AMBIL ULANG FOTO" : "AMBIL FOTO"}
              </button>
              <button
                type="button"
                disabled={!photoTaken || submitting}
                onClick={handleSubmit}
                className="mt-3 flex w-full max-w-sm items-center justify-center rounded-full bg-emerald-500 px-4 py-3 text-base font-semibold text-slate-900 shadow disabled:opacity-60"
              >
                {submitting ? "MENGUNGGAH..." : "GUNAKAN FOTO INI"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
