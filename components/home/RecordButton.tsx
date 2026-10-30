"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Pause, X, Music } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { analyzeAndGenerateSoundMask, saveSoundMask, resolveAudioUrl } from "@/lib/api";
import { blobToWav } from "@/lib/audio/toWav";
import { AnalyzeSoundResponseData, PreferenceSoundType, SoundType } from "@/types/api";

export type RecordingStatus =
  | "idle"
  | "recording"
  | "failed"
  | "success"
  | "analyzing"
  | "analyzed";

interface RecordButtonProps {
  onStatusChange?: (status: RecordingStatus) => void;
  onAudioCaptured?: (blob: Blob) => void;
  onSaved?: () => void;
  onBackHome?: () => void;
}

const SOUND_PROFILES: {
  id: string;
  label: string;
  apiSound: SoundType;
  dbType: PreferenceSoundType;
}[] = [
  { id: "default_noise", label: "Default Noise", apiSound: "default", dbType: "default" },
  { id: "rain", label: "Rain", apiSound: "rain_real", dbType: "rain" },
  { id: "sea_waves", label: "Sea Waves", apiSound: "sea_waves_real", dbType: "sea_waves" },
  { id: "wind", label: "Wind", apiSound: "wind_real", dbType: "wind" },
  { id: "water_stream", label: "Water Stream", apiSound: "water_stream_real", dbType: "water_stream" },
];

export default function RecordButton({
  onStatusChange,
  onAudioCaptured,
  onSaved,
  onBackHome,
}: RecordButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<string>("default_noise");

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<AnalyzeSoundResponseData | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Profile default dari Settings dipilih otomatis di awal
  useEffect(() => {
    const pref = SOUND_PROFILES.find((p) => p.dbType === user?.sound_preference_default);
    if (pref) setSelectedProfile(pref.id);
  }, [user?.sound_preference_default]);

  // Mengabarkan perubahan status recording ke komponen parent (page.tsx)
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Membersihkan timer, stream mic, dan audio player saat komponen unmount
  useEffect(() => {
    return () => {
      clearTimers();
      stopMicStream();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  }, []);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const stopMicStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Fungsi untuk memulai perekaman suara asli dari mikrofon
  const startRecording = async () => {
    setErrorMessage("");
    setProgress(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone is not available. Use HTTPS or localhost and a supported browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.onerror = (event: any) => {
        clearTimers();
        stopMicStream();
        setStatus("failed");
        setErrorMessage(event?.error?.message || "Recording error occurred.");
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        if (onAudioCaptured) onAudioCaptured(blob);
      };

      mediaRecorder.start();
      setStatus("recording");

      // Menjalankan Progress Bar (30 detik = 30000ms)
      const startTime = Date.now();
      const duration = 30000;

      progressIntervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const currentProgress = Math.min((elapsedTime / duration) * 100, 100);
        setProgress(currentProgress);

        if (currentProgress >= 100) {
          stopRecordingSuccess();
        }
      }, 100);

      // Selesai otomatis setelah 30 detik
      timerRef.current = setTimeout(() => {
        stopRecordingSuccess();
      }, duration);
    } catch (err: any) {
      console.error("Gagal mengakses mikrofon:", err);
      setStatus("failed");
      setErrorMessage(
        err.message || "Microphone access denied or audio device not found."
      );
    }
  };

  // Perekaman selesai dengan sukses
  const stopRecordingSuccess = () => {
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    stopMicStream();
    setStatus("success");
  };

  // Pengguna membatalkan/menghentikan rekaman secara manual
  const handleMicClick = () => {
    if (status === "idle") {
      startRecording();
    } else if (status === "recording") {
      stopRecordingSuccess();
    } else if (status === "failed") {
      startRecording();
    }
  };

  // Mengirim rekaman ke API untuk dianalisis sesuai profile yang dipilih
  const handleAnalyze = async () => {
    if (!audioBlob) {
      setAnalyzeError("Audio is not ready yet, please try again.");
      return;
    }
    const profile = SOUND_PROFILES.find((p) => p.id === selectedProfile);
    setAnalyzeError("");
    setStatus("analyzing");

    try {
      // Browser merekam webm/mp4, sedangkan API hanya menerima WAV/MP3/M4A/OGG/FLAC
      const wavBlob = await blobToWav(audioBlob);
      const file = new File([wavBlob], "recording.wav", { type: "audio/wav" });
      const res = await analyzeAndGenerateSoundMask({
        file,
        sound: profile?.apiSound ?? "default",
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || "Analysis failed.");
      }
      setAnalysisResult(res.data);
      audioElRef.current = new Audio(resolveAudioUrl(res.data.audio.url));
      audioElRef.current.onended = () => setIsPlaying(false);
      setStatus("analyzed");
    } catch (err: any) {
      console.warn("Gagal menganalisis audio:", err);
      setAnalyzeError(err.message || "Failed to analyze audio.");
      setStatus("success"); // kembali ke layar Done Recording agar bisa coba lagi
    }
  };

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Gagal memutar audio:", err);
          setAnalyzeError(err.message || "Failed to play audio.");
        });
    }
  };

  // Hanya user yang login yang boleh menyimpan; selain itu diarahkan ke login/register
  const handleSaveToLibrary = () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    setSaveError("");
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!analysisResult) return;
    if (!title.trim()) {
      setSaveError("Please enter a title.");
      return;
    }
    const profile = SOUND_PROFILES.find((p) => p.id === selectedProfile);
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await saveSoundMask({
        title: title.trim(),
        // Enum di database memakai nama tanpa "_real" (default, rain, water_stream, wind, sea_waves)
        sound_type: profile?.dbType ?? "default",
        analysis: JSON.stringify(analysisResult.analysis), // backend mengharapkan string
        r2_key: analysisResult.audio.key,
      });
      if (!res.success) throw new Error(res.message || "Failed to save.");
      setShowSaveModal(false);
      setTitle("");
      if (onSaved) onSaved(); // kembali ke halaman utama, Top Profiles ter-refresh
    } catch (err: any) {
      setSaveError(err.message || "Failed to save to library.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center my-6 w-full max-w-md mx-auto px-4">
      
      {/* 1. TAMPILAN IDLE / INITIAL STATE */}
      {status === "idle" && (
        <>
          <p
            onClick={handleMicClick}
            className="text-gray-300 text-lg md:text-xl font-medium mb-6 tracking-wide cursor-pointer hover:text-white transition-colors"
          >
            Tap to record
          </p>
          <button
            onClick={handleMicClick}
            className="cursor-pointer group relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_24px_rgba(168,85,247,0.45)] active:scale-95"
          >
            <img
              src="/record-button.svg"
              alt="Record Button"
              className="w-full h-full object-contain transition-transform duration-300"
            />
          </button>
        </>
      )}

      {/* 2. TAMPILAN RECORDING (BACKGROUND BLUE) */}
      {status === "recording" && (
        <div className="flex flex-col items-center w-full animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-serif text-blue-100 mb-8 tracking-wider">
            Recording...
          </h2>

          {/* Tombol Mikrofon Saat Recording */}
          <button
            onClick={handleMicClick}
            className="cursor-pointer group relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_24px_rgba(168,85,247,0.45)] active:scale-95"
          >
            <img
              src="/when-record-button.svg"
              alt="Recording"
              className="w-full h-full object-contain transition-transform duration-300 animate-pulse"
            />
          </button>

          <p
            onClick={handleMicClick}
            className="text-sm text-gray-300 mt-8 mb-4 cursor-pointer hover:text-white transition-colors"
          >
            Tap to stop
          </p>

          {/* Progress Bar 30 Detik */}
          <div className="w-48 md:w-56 h-3 bg-blue-950/80 rounded-full overflow-hidden border border-blue-500/30">
            <div
              className="h-full bg-blue-400 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. TAMPILAN RECORDING FAILED (BACKGROUND MAROON) */}
      {status === "failed" && (
        <div className="flex flex-col items-center w-full animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-serif text-red-300 mb-8 tracking-wider">
            Recording failed
          </h2>

          {/* Tombol Mikrofon Saat Recording Failed */}
          <button
            onClick={handleMicClick}
            className="cursor-pointer group relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_24px_rgba(248,113,113,0.4)] active:scale-95"
          >
            <img
              src="/record-failed.svg"
              alt="Recording failed"
              className="w-full h-full object-contain transition-transform duration-300"
            />
          </button>

          <p
            onClick={handleMicClick}
            className="text-sm text-red-200/80 mt-8 mb-3 cursor-pointer hover:text-white transition-colors"
          >
            Tap to try again
          </p>

          {/* Pesan Error dari API / Browser */}
          <div className="flex items-center gap-2 text-xs text-red-400/90 max-w-xs text-center px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>[ {errorMessage || "Failed to access microphone"} ]</span>
          </div>
        </div>
      )}

      {/* 4. TAMPILAN DONE RECORDING (BACKGROUND GREEN) */}
      {status === "success" && (
        <div className="flex flex-col items-center w-full animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-serif text-emerald-300 mb-1 tracking-wide">
            Done Recording!
          </h2>
          <p
            onClick={handleAnalyze}
            className="text-xs text-emerald-200/70 mb-8 cursor-pointer hover:text-white transition-colors"
          >
            Tap to Analyze
          </p>

          {/* Tombol Kaca Pembesar (Lup / Analyze) */}
          <button
            onClick={handleAnalyze}
            className="cursor-pointer group relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_24px_rgba(16,185,129,0.4)] active:scale-95"
          >
            <img
              src="/analyze-button.svg"
              alt="Analyze"
              className="w-full h-full object-contain transition-transform duration-300"
            />
          </button>

          {analyzeError && (
            <div className="mt-6 flex items-center gap-2 text-xs text-red-300 max-w-xs text-center px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>[ {analyzeError} ]</span>
            </div>
          )}

          {/* Opsi Select Profile (Radio Options) */}
          <div className="mt-8 w-full max-w-xs">
            <h3 className="text-sm font-medium text-emerald-200 text-center mb-4">
              Select Profile
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-emerald-100/90">
              {SOUND_PROFILES.map((profile) => (
                <label
                  key={profile.id}
                  className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                >
                  <input
                    type="radio"
                    name="sound_profile"
                    value={profile.id}
                    checked={selectedProfile === profile.id}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    className="w-3.5 h-3.5 accent-emerald-500 bg-transparent border-gray-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{profile.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAMPILAN ANALYZING (BACKGROUND BLUE) */}
      {status === "analyzing" && (
        <div className="flex flex-col items-center w-full animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-serif text-blue-100 mb-8 tracking-wider">
            Analyzing...
          </h2>
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-[10px] border-blue-900/70 border-t-blue-200/70 animate-spin" />
          <p className="text-sm text-gray-300 mt-8">Please wait</p>
        </div>
      )}

      {/* 6. TAMPILAN DONE ANALYZING (BACKGROUND GREEN) */}
      {status === "analyzed" && (
        <div className="flex flex-col items-center w-full animate-fadeIn">
          <h2 className="text-2xl md:text-3xl font-serif text-emerald-300 mb-8 tracking-wide">
            Done Analyzing!
          </h2>

          {/* Tombol Play / Pause */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className={`cursor-pointer group relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_24px_rgba(16,185,129,0.4)] active:scale-95 ${
              isPlaying
                ? "border-2 border-[#8AB28F]"
                : ""
            }`}
          >
            {isPlaying ? (
              <Pause className="w-20 h-20 md:w-24 md:h-24 text-[#8AB28F] fill-current" />
            ) : (
              <img
                src="/big-play-button.svg"
                alt="Play"
                className="w-full h-full object-contain transition-transform duration-300"
              />
            )}
          </button>

          {analyzeError && (
            <p className="mt-4 text-xs text-red-300">[ {analyzeError} ]</p>
          )}

          <button
            onClick={handleSaveToLibrary}
            className="mt-12 px-8 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white font-medium text-sm transition-colors active:scale-95"
          >
            Save to Library
          </button>

          <button
            onClick={() => onBackHome?.()}
            className="mt-3 text-xs text-emerald-200/70 hover:text-white underline underline-offset-4 transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* 7. MODAL SAVING (GLASSMORPHISM) */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-md">
          <div className="relative w-full max-w-xs p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setShowSaveModal(false)}
              aria-label="Close"
              className="absolute top-3 left-3 text-emerald-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-24 h-24 mt-4 mb-6 rounded-full border-2 border-emerald-100/70 bg-white/10 flex items-center justify-center">
              <Music className="w-10 h-10 text-emerald-100" />
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              maxLength={60}
              className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-emerald-200/40 text-sm text-white placeholder-emerald-100/50 outline-none focus:border-emerald-300"
            />

            {saveError && (
              <p className="mt-2 text-xs text-red-300 text-center">[ {saveError} ]</p>
            )}

            <button
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="mt-4 px-10 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
