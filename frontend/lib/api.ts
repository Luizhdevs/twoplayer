import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { auth } from "./firebase";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// ── Injeta Bearer token automaticamente em cada request ──────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Trata erros de forma centralizada ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string }>) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message ?? err.message;

    if (status === 401) {
      auth.signOut();
      window.location.href = "/login";
    }

    const msg = Array.isArray(message) ? message[0] : message;
    return Promise.reject(new ApiError(msg, status));
  },
);

// ── Helper para upload multipart ─────────────────────────────────────────────
export async function uploadFile(
  endpoint: string,
  file: File,
  extra?: Record<string, string>,
): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append("file", file);
  if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v));

  const user  = auth.currentUser;
  const token = user ? await user.getIdToken() : undefined;

  const res = await api.patch<{ data: { id: string; url: string } }>(endpoint, form, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  return res.data.data;
}
