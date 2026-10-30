"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import RecordButton, { RecordingStatus } from "@/components/home/RecordButton";
import TopProfiles from "@/components/home/TopProfiles";
import { useAuth } from "@/context/AuthContext";

export default function MainPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
  const [isReady, setIsReady] = useState(false);

  // Jika tab baru dibuka (sessionStorage kosong) dan user belum login, arahkan ke Landing Page (/)
  useEffect(() => {
    if (isAuthLoading) return;
    if (user) {
      sessionStorage.setItem("started_session", "1");
      setIsReady(true);
      return;
    }
    if (sessionStorage.getItem("started_session") === "1") {
      setIsReady(true);
    } else {
      router.replace("/");
    }
  }, [user, isAuthLoading, router]);

  // Fungsi untuk mereset tampilan kembali ke keadaan awal (Idle)
  const [resetCount, setResetCount] = useState(0);
  const handleResetHome = () => {
    setRecordingStatus("idle");
    setResetCount((c) => c + 1); // remount RecordButton hanya saat reset manual
  };

  // Penentuan warna background berdasarkan status perekaman
  const getBackgroundColor = () => {
    switch (recordingStatus) {
      case "recording":
      case "analyzing":
        return "bg-[#0c1527]"; // Dark Blue saat merekam / menganalisis
      case "failed":
        return "bg-[#220d0d]"; // Dark Maroon Red saat gagal
      case "success":
      case "analyzed":
        return "bg-[#0b1d14]"; // Dark Green saat selesai
      default:
        return "bg-[#13141c]"; // Default Theme Dark
    }
  };

  if (!isReady) {
    return <div className="min-h-screen bg-[#13141c]" />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${getBackgroundColor()}`}
    >
      {/* Navbar Header dengan fungsi reset state */}
      <Navbar 
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)} 
        onResetHome={handleResetHome}
      />

      {/* Mobile Drawer Menu */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Recording Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full">
        <RecordButton
          key={`record-${resetCount}`}
          onStatusChange={(status) => setRecordingStatus(status)}
          onSaved={handleResetHome}
          onBackHome={handleResetHome}
          onAudioCaptured={(blob) => {
            console.log("Audio Blob berhasil ditangkap:", blob);
          }}
        />

        {/* Top Profiles hanya ditampilkan ketika tidak sedang merekam/terjadi error */}
        {recordingStatus === "idle" && (
          <TopProfiles key={`profiles-${resetCount}`} />
        )}
      </main>

      {/* Footer Spacer */}
      <footer
        className="py-4 text-center text-xs text-gray-600"
        suppressHydrationWarning
      >
        Adaptive SoundScape 2026
      </footer>
    </div>
  );
}

