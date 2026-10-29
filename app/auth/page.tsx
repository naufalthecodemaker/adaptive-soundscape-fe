"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Urutan warna transisi sama seperti Landing Page: hitam/netral - merah - hijau - biru
const COLOR_LAYERS = [
  "linear-gradient(to bottom, #13141c 0%, #1b1c24 100%)", // netral
  "linear-gradient(to bottom, #231a1b 0%, #4a1414 100%)", // merah
  "linear-gradient(to bottom, #1b231c 0%, #1f4a14 100%)", // ijo
  "linear-gradient(to bottom, #1b1b26 0%, #1c1a5c 100%)", // biru
];

const HOLD_MS = 3200;
const FADE_MS = 1800;

export default function AuthPage() {
  const [activeBg, setActiveBg] = useState(0);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      setActiveBg((i) => (i + 1) % COLOR_LAYERS.length);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        await loginUser({
          username: formData.username,
          password: formData.password,
        });
        await refreshUser();
        router.push("/home");
      } else {
        await registerUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        // Otomatis login setelah berhasil register
        await loginUser({
          username: formData.username,
          password: formData.password,
        });
        await refreshUser();
        router.push("/home");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#13141c] text-white flex flex-col items-center justify-center p-4">
      {/* Layer background yang cross-fade */}
      {COLOR_LAYERS.map((bg, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: bg,
            opacity: activeBg === i ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
        />
      ))}

      {/* LOGO WAVEFORM HEADER */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="w-24 h-24 md:w-28 md:h-28 mb-4 flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="Adaptive SoundScape Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-wide">
          {mode === "login" ? "Welcome!" : "Sign Up"}
        </h2>
        <p className="text-sm text-gray-400 font-serif mt-1">
          {mode === "login" ? "Sign in to continue" : "Let's sign you up"}
        </p>
      </div>

      {/* CARD FORM DENGAN AUTH-FRAME.SVG RAINBOW */}
      <div className="relative z-10 w-full max-w-sm rounded-t-[28px] rounded-b-3xl overflow-hidden shadow-2xl">
        {/* Background & Rainbow Top Frame dari auth-frame.svg */}
        <img
          src="/auth-frame.svg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
        />

        <div className="relative z-10 w-full p-6 md:p-8 pt-9 md:pt-10 flex flex-col">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* INPUT USERNAME */}
            <div>
              <input
                type="text"
                name="username"
                placeholder={mode === "login" ? "Username / Email" : "Username"}
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-[#2F313D] text-gray-200 placeholder-gray-400 text-sm border border-transparent focus:outline-none focus:border-purple-400/50 transition-colors"
              />
            </div>

            {/* INPUT EMAIL (KHUSUS REGISTER) */}
            {mode === "register" && (
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-[#2F313D] text-gray-200 placeholder-gray-400 text-sm border border-transparent focus:outline-none focus:border-purple-400/50 transition-colors"
                />
              </div>
            )}

            {/* INPUT PASSWORD */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-[#2F313D] text-gray-200 placeholder-gray-400 text-sm border border-transparent focus:outline-none focus:border-purple-400/50 transition-colors"
              />
            </div>

            {/* FORGOT PASSWORD LINK (LOGIN ONLY) */}
            {mode === "login" && (
              <div className="text-right pt-1">
                <button
                  type="button"
                  className="text-xs text-gray-300 hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* TOMBOL SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-3 rounded-xl bg-[#2B59FF] hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-600/30 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting
                ? "Memproses..."
                : mode === "login"
                ? "Sign in"
                : "Sign up"}
            </button>
          </form>

          {/* TOGGLE MODE LOGIN <-> REGISTER */}
          <div className="mt-7 text-center text-xs text-gray-400 font-serif">
            {mode === "login" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setErrorMsg("");
                  }}
                  className="text-[#4C8DFF] font-medium hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setErrorMsg("");
                  }}
                  className="text-[#4C8DFF] font-medium hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
