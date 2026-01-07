import { LateStatus, SatpamDashboardShift } from "./types";

function parseShiftStart(
  date: string | undefined | null,
  shift: SatpamDashboardShift | null | undefined
): Date | null {
  if (!date || !shift?.start_time) return null;

  const [yearStr, monthStr, dayStr] = date.split("-");
  const [hourStr, minuteStr] = shift.start_time.split(":");

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (
    [year, month, day, hour, minute].some(
      (v) => Number.isNaN(v) || !Number.isFinite(v)
    )
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function calculateLateMinutes(
  date: string | undefined | null,
  shift: SatpamDashboardShift | null | undefined,
  clockInIso: string | undefined | null
): number | null {
  if (!clockInIso) return null;

  const shiftStart = parseShiftStart(date, shift);
  if (!shiftStart) return null;

  const clockIn = new Date(clockInIso);
  if (Number.isNaN(clockIn.getTime())) return null;

  const diffMs = clockIn.getTime() - shiftStart.getTime();
  if (diffMs <= 0) return 0;

  return Math.round(diffMs / 60000); // minutes
}

export function formatLateDuration(
  minutes: number | null | undefined
): string | null {
  if (minutes == null || minutes <= 0) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} jam`);
  }
  if (mins > 0) {
    parts.push(`${mins} menit`);
  }

  return parts.join(" ");
}

export function formatLateStatusDisplay(
  status: LateStatus | null | undefined,
  date: string | undefined | null,
  shift: SatpamDashboardShift | null | undefined,
  clockInIso: string | undefined | null
): string {
  if (!status) return "-";

  const lateMinutes = calculateLateMinutes(date, shift, clockInIso);
  const durationText = formatLateDuration(lateMinutes);

  switch (status) {
    case "ON_TIME":
      return "Tepat waktu";
    case "LATE":
      return durationText ? `Terlambat ${durationText}` : "Terlambat";
    case "TOO_LATE":
      return durationText
        ? `Terlambat ${durationText}`
        : "Terlambat";
    default:
      return status;
  }
}

