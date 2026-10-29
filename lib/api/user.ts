import { fetchAPI } from "./client";
import { ApiResponse, PreferenceSoundType, UpdateProfilePayload, UserData } from "@/types/api";

/**
 * PUT /api/me  (butuh endpoint backend: belum tersedia di API saat ini)
 * mengubah username dan email user yang sedang login
 */
export async function updateProfile(payload: UpdateProfilePayload) {
  return fetchAPI<ApiResponse<UserData>>("api/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /api/me  (butuh endpoint backend: belum tersedia di API saat ini)
 * menghapus akun user yang sedang login
 */
export async function deleteAccount() {
  return fetchAPI<ApiResponse<null>>("api/me", {
    method: "DELETE",
  });
}

export async function getCurrentUser() {
  return fetchAPI<ApiResponse<UserData>>("api/me", {
    method: "GET",
  });
}

export async function updateSoundPreference(soundPreference: PreferenceSoundType) {
  return fetchAPI<ApiResponse<null>>("api/sound-preference", {
    method: "PUT",
    body: JSON.stringify({
      sound_preference_default: soundPreference,
    }),
  });
}