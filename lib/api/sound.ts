import { fetchAPI } from "./client";
import { 
  ApiResponse, 
  AnalyzeSoundParams, 
  AnalyzeSoundResponseData, 
  GetSoundMasksParams, 
  SavedSoundMaskItem, 
  SaveSoundMaskPayload 
} from "@/types/api";

/**
 * POST /api/sound/analyze
 * menganalisis rekaman suara dengan Dynamic STFT
 */
export async function analyzeAndGenerateSoundMask({
  file,
  sound,
  texture_mix = 0.8,
  whiten = 1.0,
}: AnalyzeSoundParams) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sound", sound);
  formData.append("texture_mix", texture_mix.toString());
  formData.append("whiten", whiten.toString());

  return fetchAPI<ApiResponse<AnalyzeSoundResponseData>>("api/sound/analyze", {
    method: "POST",
    body: formData,
  });
}

/**
 * POST /api/sound/save
 * menyimpan URL masking sound dan hasil analisis ke database
 */
export async function saveSoundMask(payload: SaveSoundMaskPayload) {
  return fetchAPI<ApiResponse<SavedSoundMaskItem>>("api/sound/save", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Mengecek apakah presigned URL R2/S3 sudah kedaluwarsa berdasarkan parameter X-Amz-Date dan X-Amz-Expires.
 */
export function isPresignedUrlExpired(urlStr?: string): boolean {
  if (!urlStr) return true;
  try {
    const u = new URL(urlStr);
    const amzDate = u.searchParams.get("X-Amz-Date");
    const amzExpires = u.searchParams.get("X-Amz-Expires");
    if (!amzDate || !amzExpires) return false;

    // Format X-Amz-Date: YYYYMMDDTHHMMSSZ (contoh: 20261029T133000Z)
    const m = amzDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) return false;

    const issuedMs = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    const expiresMs = issuedMs + Number(amzExpires) * 1000;
    return Date.now() >= expiresMs;
  } catch {
    return false;
  }
}

/**
 * GET /api/sound
 * mengambil daftar masking sound milik user dengan query filter
 * dan menyaring (menghilangkan) audio yang presigned URL-nya sudah kedaluwarsa (> 1 jam)
 */
export async function getSavedSoundMasks(params?: GetSoundMasksParams) {
  const queryParams = new URLSearchParams();

  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.sound_type) {
    queryParams.append("sound_type", params.sound_type);
  }

  const queryString = queryParams.toString();
  const endpoint = queryString ? `api/sound?${queryString}` : "api/sound";

  const res = await fetchAPI<ApiResponse<SavedSoundMaskItem[]>>(endpoint, {
    method: "GET",
  });

  if (res.data && Array.isArray(res.data)) {
    res.data = res.data.filter((item) => !isPresignedUrlExpired(item.r2_audio_url));
  }

  return res;
}


/**
 * DELETE /api/sound  (butuh endpoint backend: belum tersedia di API saat ini)
 * menghapus seluruh library suara milik user
 */
export async function resetLibrary() {
  return fetchAPI<ApiResponse<null>>("api/sound", {
    method: "DELETE",
  });
}
