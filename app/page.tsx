"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Urutan warna: item (netral) - merah - ijo - biru - item (loop)
const COLOR_LAYERS = [
  "linear-gradient(to bottom, #1b1c24 0%, #1b1c24 100%)", // netral
  "linear-gradient(to bottom, #231a1b 0%, #4a1414 100%)", // merah
  "linear-gradient(to bottom, #1b231c 0%, #1f4a14 100%)", // ijo
  "linear-gradient(to bottom, #1b1b26 0%, #1c1a5c 100%)", // biru
];

const INITIAL_DELAY_MS = 5000; // tahan warna awal sejenak agar render awal stabil & cepat
const HOLD_MS = 3000; // lama tiap warna ditampilkan setelahnya
const FADE_MS = 1800; // durasi transisi antar warna

export default function LandingPage() {
  const [active, setActive] = useState(0);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Jika user sudah login, langsung arahkan ke /home
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/home");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      setActive((i) => (i + 1) % COLOR_LAYERS.length);
      intervalId = setInterval(() => {
        setActive((i) => (i + 1) % COLOR_LAYERS.length);
      }, HOLD_MS);
    }, INITIAL_DELAY_MS);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center text-white">
      {/* Layer background yang cross-fade */}
      {COLOR_LAYERS.map((bg, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute inset-0"
          style={{
            background: bg,
            opacity: active === i ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}

      <main className="relative z-10 flex flex-col items-center px-4">
        <img
          src="/logo.svg"
          alt="Adaptive SoundScape Logo"
          width={160}
          height={160}
          fetchPriority="high"
          className="w-32 h-32 md:w-40 md:h-40 object-contain mb-6"
        />

        <h1 className="text-base md:text-lg font-serif mb-4 text-center">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-orange-300 via-yellow-200 to-lime-300 bg-clip-text text-transparent">
            Adaptive
          </span>{" "}
          <span className="bg-gradient-to-r from-lime-300 via-emerald-200 to-sky-200 bg-clip-text text-transparent">
            SoundScape
          </span>
          !
        </h1>

        <button
          onClick={() => {
            sessionStorage.setItem("started_session", "1");
            router.push("/home");
          }}
          className="cursor-pointer flex items-center gap-2 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 font-serif text-sm transition-colors active:scale-95"
        >
          Get started
          <ChevronRight className="w-4 h-4" />
        </button>
      </main>

      <footer className="absolute bottom-6 z-10 text-[10px] text-gray-400">
        by Group 02 RPL-02
      </footer>
    </div>
  );
}
