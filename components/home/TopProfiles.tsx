"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Lock, Music } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAuth } from "@/context/AuthContext";
import { getSavedSoundMasks } from "@/lib/api";
import { SavedSoundMaskItem } from "@/types/api";

export default function TopProfiles() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const player = useAudioPlayer();

  const [profiles, setProfiles] = useState<SavedSoundMaskItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Mengambil data top profiles dari database jika user sudah terautentikasi
  useEffect(() => {
    async function fetchTopProfiles() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const res = await getSavedSoundMasks();
        if (res.success && res.data) {
          // Mengambil maksimal 3 profil teratas
          setProfiles(res.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Gagal mengambil data top profiles:", err);
      } finally {
        setIsLoadingData(false);
      }
    }

    if (user) {
      fetchTopProfiles();
    }
  }, [user]);

  // Navigasi ke halaman Library atau Auth saat tombol diklik
  const handleLibraryClick = () => {
    if (user) {
      router.push("/library");
    } else {
      router.push("/auth");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center">
      {/* Pembatas judul section */}
      <div className="w-full flex items-center gap-4 my-6">
        <div className="h-[1px] bg-gray-800 flex-1" />
        <span className="text-gray-400 text-sm font-medium">Your top profiles</span>
        <div className="h-[1px] bg-gray-800 flex-1" />
      </div>

      {/* Konten utama berdasarkan status autentikasi & data */}
      <div className="w-full mb-8">
        {/* Kondisi 1: Belum login */}
        {!user && !isAuthLoading && (
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#181924]/60 border border-gray-800 text-center">
            <div className="p-3 bg-purple-500/10 rounded-full mb-3 text-purple-400">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-300 font-medium mb-1">
              Please log in first
            </p>
            <p className="text-xs text-gray-500 max-w-xs">
              Sign in to your account to view and play your saved sound profiles.
            </p>
          </div>
        )}

        {/* Kondisi 2: Sedang memuat data dari database */}
        {user && isLoadingData && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-14 rounded-lg bg-[#181924]/40 border border-gray-800/40 animate-pulse flex items-center px-4"
              />
            ))}
          </div>
        )}

        {/* Kondisi 3: Sudah login & ada data tersimpan */}
        {user && !isLoadingData && profiles.length > 0 && (
          <div className="space-y-3">
            {profiles.map((sound, index) => (
              <div
                key={sound.id || index}
                onClick={() => router.push(`/play/${sound.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-[#181924]/50 border border-gray-800/60 hover:border-purple-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {sound.title || `Sound ${index + 1}`}
                  </span>
                </div>

                <button 
                  className="p-2 text-gray-400 group-hover:text-purple-400 transition-colors"
                  aria-label={`${player.playingId === sound.id && player.isPlaying ? "Pause" : "Play"} ${sound.title || 'Sound'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    player.toggle(sound.id, sound.r2_audio_url || sound.r2_key || "");
                  }}
                >
                  {player.playingId === sound.id && player.isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Kondisi 4: Sudah login tapi belum ada data */}
        {user && !isLoadingData && profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#181924]/40 border border-gray-800/40 text-center">
            <Music className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-sm text-gray-400 font-medium">
              No saved sound profiles yet
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Record your first sound above to create a custom soundscape!
            </p>
          </div>
        )}
      </div>

      {/* Tombol ke halaman Library */}
      <button
        onClick={handleLibraryClick}
        className="w-full max-w-xs py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-base shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-blue-600/50 active:scale-95"
      >
        Library
      </button>
    </div>
  );
}