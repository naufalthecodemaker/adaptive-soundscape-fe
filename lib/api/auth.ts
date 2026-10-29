import { fetchAPI } from "./client";
import { ApiResponse, LoginPayload, RegisterPayload } from "@/types/api";

export async function registerUser(payload: RegisterPayload) {
  return fetchAPI<ApiResponse<any>>("api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  return fetchAPI<ApiResponse<any>>("api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser() {
  return fetchAPI<ApiResponse<any>>("api/auth/logout", {
    method: "POST",
  });
}