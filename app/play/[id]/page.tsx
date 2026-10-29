"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward, Repeat, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { useAuth } from "@/context/AuthContext";
import { getSavedSoundMasks } from "@/lib/api";
import { getSoundTheme } from "@/lib/soundTheme";
import { SavedSoundMaskItem } from "@/types/api";

const formatTime = (s: number) => {
  if (!isFinite(s)) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

function PlayPageContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sounds, setSounds] = useState<SavedSoundMaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(true); // suara masking dibuat untuk loop

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/auth");
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await getSavedSoundMasks();
        setSounds(res.data ?? []);
      } catch (err: any) {
        setError(err.message || "Failed to load sound.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  const index = sounds.findIndex((s) => s.id === id);
  const sound = index >= 0 ? sounds[index] : null;
  const theme = useMemo(() => getSoundTheme(sound?.sound_type), [sound?.sound_type]);

  // Siapkan audio setiap kali suara yang dipilih berganti
  useEffect(() => {
    if (!sound) return;
    const audio = new Audio(sound.r2_audio_url);
    audioRef.current = audio;
    setCurrent(0);
    setDuration(0);
    setIsPlaying(false);
    setError("");

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrent(audio.currentTime);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = () => setError("Failed to load audio. The link may have expired.");

    audio.play().catch(() => {
      /* autoplay bisa diblokir browser, user tinggal klik play */
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeat;
  }, [repeat, sound?.id]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch((e) => setError(e.message || "Failed to play audio."));
    } else {
      a.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = (Number(e.target.value) / 100) * duration;
  };

  const goTo = (offset: number) => {
    if (sounds.length === 0 || index < 0) return;
    const next = sounds[(index + offset + sounds.length) % sounds.length];
    router.replace(`/play/${next.id}`);
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const Icon = theme.Icon;

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-700"
      style={{ background: theme.background }}
    >
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col items-center">
        {isLoading && <p className="text-sm text-gray-400 mt-20">Loading...</p>}

        {!isLoading && !sound && (
          <div className="mt-20 text-center text-gray-300">
            <p className="text-sm mb-4">{error || "Sound not found."}</p>
            <button
              onClick={() => router.push("/library")}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Back to Library
            </button>
          </div>
        )}

        {sound && (
          <>
            <h1
              className="text-2xl font-bold mt-4 mb-10 text-center truncate max-w-full"
              style={{ color: theme.accent }}
            >
              [ {sound.title} ]
            </h1>

            {/* Artwork */}
            <div
              className={`w-52 h-52 md:w-60 md:h-60 rounded-full flex items-center justify-center shadow-2xl border-2 ${
                isPlaying ? "animate-pulse" : ""
              }`}
              style={{ background: theme.artwork, borderColor: theme.ring }}
            >
              <Icon className="w-24 h-24" style={{ color: theme.accent }} strokeWidth={1.2} />
            </div>
            <p className="mt-3 text-xs capitalize" style={{ color: theme.ring }}>
              {theme.label}
            </p>

            {/* Progress */}
            <div className="w-full mt-14">
              <div className="flex justify-between text-[11px] mb-1" style={{ color: theme.accent }}>
                <span>{formatTime(current)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={pct}
                onChange={seek}
                aria-label="Seek"
                className="w-full h-2 rounded-full cursor-pointer appearance-none bg-white/15"
                style={{ accentColor: theme.ring }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-300 mt-4">
                <AlertCircle className="w-4 h-4" />
                <span>[ {error} ]</span>
              </div>
            )}

            {/* Controls */}
            <div className="mt-8 flex items-center justify-center gap-6" style={{ color: theme.accent }}>
              <button
                onClick={() => setRepeat((r) => !r)}
                aria-label="Repeat"
                aria-pressed={repeat}
                className={`p-2 rounded-full transition-opacity ${repeat ? "opacity-100" : "opacity-40"}`}
              >
                <Repeat className="w-6 h-6" />
              </button>
              <button onClick={() => goTo(-1)} aria-label="Previous" className="p-2 hover:opacity-70">
                <SkipBack className="w-6 h-6 fill-current" />
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ${
                  !isPlaying && theme.playButtonSvg ? "" : "border-2"
                }`}
                style={
                  !isPlaying && theme.playButtonSvg
                    ? undefined
                    : { borderColor: theme.ring }
                }
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : theme.playButtonSvg ? (
                  <img
                    src={theme.playButtonSvg}
                    alt="Play"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Play className="w-7 h-7 fill-current" />
                )}
              </button>
              <button onClick={() => goTo(1)} aria-label="Next" className="p-2 hover:opacity-70">
                <SkipForward className="w-6 h-6 fill-current" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#13141c] text-gray-400 text-sm">
          Loading...
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  );
}

