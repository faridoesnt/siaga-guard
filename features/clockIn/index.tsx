"use client";

import type { RefObject } from "react";
import { ClockArrowDown } from "lucide-react";

type ClockInProps = {
  canClockIn: boolean;
  clockInLoading: boolean;
  clockInError: string | null;
  isOpen: boolean;
  onOpenCamera: () => void;
  onClose: () => void;
  onSubmit: () => void;
  tooltipText: string;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
};

export default function ClockInCard({
  canClockIn,
  clockInLoading,
  clockInError,
  isOpen,
  onOpenCamera,
  onClose,
  onSubmit,
  tooltipText,
  videoRef,
  canvasRef,
}: ClockInProps) {
  const label = clockInLoading ? "CLOCK IN..." : "CLOCK IN";
  const disabled = !canClockIn;

  return (
    <>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <button
          type="button"
          disabled={disabled}
          onClick={onOpenCamera}
          title={disabled ? tooltipText : undefined}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow transition active:scale-95 active:shadow-inner disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={label}
        >
          <ClockArrowDown className="h-7 w-7" />
        </button>
        <span className="text-[11px] font-semibold text-slate-700">
          {label}
        </span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-20 flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-slate-50">
              Ambil foto wajah
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
              disabled={clockInLoading}
              onClick={onSubmit}
              className="mt-4 flex w-full max-w-sm items-center justify-center rounded-full bg-emerald-500 px-4 py-3 text-base font-semibold text-slate-900 shadow disabled:opacity-60"
            >
              {clockInLoading ? "Mengirim..." : "AMBIL FOTO & CLOCK IN"}
            </button>
            {clockInError && (
              <p className="mt-2 text-xs text-red-400">{clockInError}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
