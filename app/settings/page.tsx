"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { useAuth } from "@/context/AuthContext";
import { updateSoundPreference, resetLibrary } from "@/lib/api";
import { PreferenceSoundType } from "@/types/api";

const PROFILE_OPTIONS: { value: PreferenceSoundType; label: string }[] = [
  { value: "rain", label: "Rain" },
  { value: "sea_waves", label: "Sea Waves" },
  { value: "wind", label: "Wind" },
  { value: "water_stream", label: "Water Stream" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [preference, setPreference] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [showReset, setShowReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/auth");
  }, [user, isAuthLoading, router]);

  // Isi pilihan awal dari preferensi user yang tersimpan
  useEffect(() => {
    if (user) setPreference(user.sound_preference_default);
  }, [user]);

  const handleSave = async () => {
    if (!preference) {
      setSaveMessage({ type: "error", text: "Please choose a default profile." });
      return;
    }
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await updateSoundPreference(preference as PreferenceSoundType);
      if (!res.success) throw new Error(res.message || "Failed to save changes.");
      await refreshUser();
      setSaveMessage({ type: "ok", text: "Changes saved." });
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err.message || "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setResetError("");
    try {
      const res = await resetLibrary();
      if (!res.success) throw new Error(res.message || "Failed to reset library.");
      setShowReset(false);
      setResetDone(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset library.");
    } finally {
      setIsResetting(false);
    }
  };

  const Divider = ({ title }: { title: string }) => (
    <div className="w-full flex items-center gap-4 my-6">
      <div className="h-[1px] bg-gray-700 flex-1" />
      <span className="text-gray-300 text-sm font-serif">{title}</span>
      <div className="h-[1px] bg-gray-700 flex-1" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#13141c]">
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="flex-1 w-full max-w-sm mx-auto px-6 py-6 flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-indigo-100 mb-4">Settings</h1>

        {/* Default profile */}
        <Divider title="Your default profile" />
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm text-gray-300 w-full px-4">
          {PROFILE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:text-white">
              <input
                type="radio"
                name="default_profile"
                value={opt.value}
                checked={preference === opt.value}
                onChange={(e) => setPreference(e.target.value)}
                className="w-4 h-4 accent-indigo-400 cursor-pointer"
              />
              {opt.label}
            </label>
          ))}
        </div>

        {/* Reset library */}
        <Divider title="Reset library" />
        <div className="w-full px-4">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Reset your library</span>
            <button
              onClick={() => {
                setResetError("");
                setShowReset(true);
              }}
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Reset
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            *resetting your library means deleting your whole library
          </p>
          {resetDone && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-300 mt-3">
              <CheckCircle2 className="w-4 h-4" /> Your library has been reset.
            </p>
          )}
        </div>

        {/* Save */}
        <div className="mt-12 flex flex-col items-center gap-3 w-full">
          {saveMessage && (
            <p
              className={`flex items-center gap-1.5 text-xs ${
                saveMessage.type === "ok" ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {saveMessage.type === "ok" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {saveMessage.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </main>

      {/* MODAL RESET LIBRARY */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs p-6 rounded-2xl bg-[#241518] border border-red-500/30 shadow-2xl text-center">
            <h2 className="font-semibold text-lg mb-2">Reset library?</h2>
            <p className="text-xs text-gray-300 mb-4">
              All of your saved sounds will be permanently deleted. This cannot be undone.
            </p>
            {resetError && (
              <div className="flex items-center gap-2 text-xs text-red-300 mb-3 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>[ {resetError} ]</span>
              </div>
            )}
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="w-full py-2 mb-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-60 text-sm font-medium"
            >
              {isResetting ? "Resetting..." : "Yes, reset my library"}
            </button>
            <button
              onClick={() => setShowReset(false)}
              className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

