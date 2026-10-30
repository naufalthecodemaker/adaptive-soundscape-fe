export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Auth Types
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

// User Types
export interface UserData {
  sub: string;
  username: string;
  sound_preference_default: string;
  email?: string; // belum dikembalikan oleh GET /api/me saat ini
  created_at?: string; // belum dikembalikan oleh GET /api/me saat ini
}

export type PreferenceSoundType = "default" | "rain" | "water_stream" | "wind" | "sea_waves";
export type SoundType = "default" | "rain_real" | "water_stream_real" | "wind_real" | "sea_waves_real";

// Sound & Analysis Types
export interface AnalyzeSoundParams {
  file: File | Blob;
  sound: SoundType;
  texture_mix?: number;
  whiten?: number;
}

export interface AnalyzeSoundResponseData {
  sound: Record<string, number>;
  texture_mix: number;
  whiten: number;
  audio: {
    key: string;
    url: string;
    expires_in_s: number;
    format: string;
    sample_rate: number;
    duration_s: number;
  };
  analysis: Record<string, any>;
  quality: Record<string, number>;
}

// Save & Get Sound Mask Types
export interface SaveSoundMaskPayload {
  title: string;
  sound_type: string;
  analysis: string | Record<string, any>; // Stringified JSON / JSON Object
  r2_key: string;
}

export interface SavedSoundMaskItem {
  id: string;
  user_id?: string;
  title: string;
  sound_type: string;
  analysis: string | Record<string, any>;
  r2_audio_url: string;
  r2_key?: string;
  created_at?: string;
}

export interface GetSoundMasksParams {
  search?: string;
  sound_type?: string;
}


export interface UpdateProfilePayload {
  username: string;
  email: string;
}
