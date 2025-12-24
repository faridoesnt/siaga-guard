"use client";

const TOKEN_KEY = "siaga_guard_token";
const USER_KEY = "siaga_guard_user";
const ATTENDANCE_KEY = "siaga_guard_attendance_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ATTENDANCE_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export interface StoredUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function setStoredUser(user: StoredUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setTodayAttendanceId(id: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ATTENDANCE_KEY, String(id));
}

export function getTodayAttendanceId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ATTENDANCE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

