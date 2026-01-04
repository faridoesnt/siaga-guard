"use client";

import type { RefObject } from "react";
import { ClockArrowUp } from "lucide-react";

type ClockOutProps = {
  canClockOut: boolean;
  clockOutLoading: boolean;
  clockOutError: string | null;
  clockOutPhotoTaken: boolean;
  isOpen: boolean;
  onOpenCamera: () => void;
  onClose: () => void;
  onCapturePhoto: () => void;
  onSubmit: () => void;
  tooltipText: string;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

export default function ClockOutCard({
  canClockOut,
  clockOutLoading,
  clockOutError,
  clockOutPhotoTaken,
  isOpen,
  onOpenCamera,
  onClose,
  onCapturePhoto,
  onSubmit,
  tooltipText,
  videoRef,
  canvasRef,
}: ClockOutProps) {
  const label = clockOutLoading ? "CLOCK OUT..." : "CLOCK OUT";
  const disabled = !canClockOut;

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <button
          type="button"
          disabled={disabled}
          onClick={onOpenCamera}
          title={disabled ? tooltipText : undefined}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-white shadow transition active:scale-95 active:shadow-inner disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={label}
        >
          <ClockArrowUp className="h-7 w-7 text-white" />
        </button>
        <span className="text-[11px] font-semibold text-slate-700">
          {label}
        </span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-20 flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-slate-50">
              Ambil foto clock out
            </p>
            <button
              type="button"
              onClick={onClose}
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
              onClick={onCapturePhoto}
              className="mt-4 flex w-full max-w-sm items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-base font-semibold text-slate-900 shadow"
            >
              {clockOutPhotoTaken ? "AMBIL ULANG FOTO" : "AMBIL FOTO CLOCK OUT"}
            </button>
            <button
              type="button"
              disabled={!clockOutPhotoTaken || clockOutLoading}
              onClick={onSubmit}
              className="mt-3 flex w-full max-w-sm items-center justify-center rounded-full bg-emerald-500 px-4 py-3 text-base font-semibold text-slate-900 shadow disabled:opacity-60"
            >
              {clockOutLoading ? "MENGIRIM..." : "KIRIM & CLOCK OUT"}
            </button>
            {clockOutError && (
              <p className="mt-2 text-xs text-red-400">{clockOutError}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
