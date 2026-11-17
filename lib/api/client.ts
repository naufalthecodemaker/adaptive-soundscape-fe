import { ApiResponse } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://adaptive-soundscape-api.vercel.app";

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Gunakan same-origin rewrite (/backend-api) di browser agar bebas blokir CORS & cookie SameSite=Lax tetap terkirim
  const baseUrl = typeof window !== "undefined" ? "/backend-api" : API_BASE_URL;

  const headers: Record<string, string> = {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
    credentials: "include", // mengirimkan cookie access_token
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.detail || `HTTP Error: ${res.status}`);
  }

  return res.json();
}