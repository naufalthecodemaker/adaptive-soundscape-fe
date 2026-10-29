"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Player audio tunggal: hanya satu suara yang diputar pada satu waktu.
 * Dipakai oleh Top Profiles dan halaman Library.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null); // id yang sedang aktif (play/pause)
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 - 100
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(
    (id: string, url: string) => {
      setError("");

      // Klik item yang sama -> play/pause
      if (audioRef.current && playingId === id) {
        if (audioRef.current.paused) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => setError(e.message));
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      // Klik item lain -> ganti audio
      audioRef.current?.pause();
      const audio = new Audio(url);
      audio.loop = true; // suara masking dibuat untuk loop
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Failed to load audio. The link may have expired.");
      };
      audioRef.current = audio;
      setPlayingId(id);
      setProgress(0);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          setIsPlaying(false);
          setError(e.message || "Failed to play audio.");
        });
    },
    [playingId]
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
    setIsPlaying(false);
    setProgress(0);
  }, []);

  return { playingId, isPlaying, progress, error, toggle, stop };
}

