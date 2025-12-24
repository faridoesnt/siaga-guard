"use client";

import { ApiError, ApiResponse } from "./types";
import { getToken, clearToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8686";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, ...rest } = options;

  const headers: HeadersInit = {
    ...(rest.headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  if (!isFormData && !("Content-Type" in headers)) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
  });

  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    if (res.ok) {
      throw new ApiError("Invalid response from server", res.status);
    }
    const err = new ApiError("Request failed", res.status);
    if (res.status === 401) {
      clearToken();
    }
    throw err;
  }

  if (!res.ok || !payload.success) {
    const message = payload.error?.message || "Request failed";
    const code = payload.error?.code;
    const apiError = new ApiError(message, res.status, code, payload);
    if (res.status === 401) {
      clearToken();
    }
    throw apiError;
  }

  let data = payload.data as T;
  if (data == null) {
    data = ([] as unknown) as T;
  }

  return data;
}
