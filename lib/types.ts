export interface ApiErrorBody {
  code?: string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  raw?: unknown;

  constructor(message: string, status: number, code?: string, raw?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

export type AttendanceStatus = "NONE" | "CLOCKED_IN" | "CLOCKED_OUT";

export type LateStatus = "ON_TIME" | "LATE" | "TOO_LATE";

export interface SatpamDashboardShift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  late_tolerance_minute: number;
}

export interface SatpamDashboardAttendance {
  status: AttendanceStatus;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  late_status?: LateStatus | null;
}

export interface SatpamDashboard {
  date: string;
  shift: SatpamDashboardShift | null;
  attendance: SatpamDashboardAttendance | null;
  has_open_attendance?: boolean;
  can_clock_in?: boolean;
  can_clock_out?: boolean;
  open_attendance_summary?: SatpamDashboardAttendance | null;
}

export interface SatpamAttendanceHistoryItem {
  date: string;
  shift: SatpamDashboardShift | null;
  attendance: SatpamDashboardAttendance | null;
}

export interface MeResponse {
  id: number;
  email: string;
  name: string;
  work_start_date?: string | null;
}

export interface LoginUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: LoginUser;
}

export type ShiftSwapStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ShiftSwapRequest {
  id: number;
  requester_user_id: number;
  target_user_id: number;
  shift_date: string;
  requester_user_shift_id: number;
  target_user_shift_id: number;
  status: ShiftSwapStatus;
  reason?: string | null;
  note?: string | null;
  decided_by?: number | null;
  decided_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SatpamPeer {
  id: number;
  name: string;
  email: string;
}

export interface Attendance {
  id: number;
  user_id: number;
  shift_id: number;
  attendance_spot_id?: number | null;
  attendance_date: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
  clock_in_status?: string | null;
}
