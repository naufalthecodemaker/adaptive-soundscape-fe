"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Play,
  Pause,
  Music,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { useAuth } from "@/context/AuthContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { getSavedSoundMasks } from "@/lib/api";
import { SavedSoundMaskItem } from "@/types/api";

const PAGE_SIZE = 7;

// Kelompok suara untuk filter (cocokkan sebagian dari sound_type di database)
const CATEGORIES = [
  { key: "rain", label: "Rain", style: "bg-blue-900/60 text-blue-200 border-blue-500/40" },
  { key: "wind", label: "Wind", style: "bg-green-900/60 text-green-200 border-green-500/40" },
  { key: "wave", label: "Wave", style: "bg-purple-900/60 text-purple-200 border-purple-500/40" },
  { key: "water", label: "Water", style: "bg-cyan-900/60 text-cyan-200 border-cyan-500/40" },
  { key: "default", label: "Default", style: "bg-gray-700/60 text-gray-200 border-gray-500/40" },
];

type SortMode = "newest" | "oldest" | "az" | "za";
const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest",
  oldest: "Oldest",
  az: "A - Z",
  za: "Z - A",
};

export default function LibraryPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const player = useAudioPlayer();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sounds, setSounds] = useState<SavedSoundMaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);

  // Library hanya untuk user yang sudah login
  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/auth");
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await getSavedSoundMasks();
        setSounds(res.data ?? []);
      } catch (err: any) {
        setError(err.message || "Failed to load library.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [query, category, sortMode]);

  const filtered = useMemo(() => {
    let list = sounds.filter((s) => {
      const matchQuery = (s.title || "").toLowerCase().includes(query.trim().toLowerCase());
      const matchCat = category ? (s.sound_type || "").toLowerCase().includes(category) : true;
      return matchQuery && matchCat;
    });
    // Urutan asli dari API = terbaru dulu
    if (sortMode === "oldest") list = [...list].reverse();
    if (sortMode === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "za") list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    return list;
  }, [sounds, query, category, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const nowPlaying = sounds.find((s) => s.id === player.playingId);

  // Lagu berikutnya dari hasil filter saat ini
  const playNext = () => {
    if (filtered.length === 0) return;
    const idx = filtered.findIndex((s) => s.id === player.playingId);
    const next = filtered[(idx + 1) % filtered.length];
    player.toggle(next.id, next.r2_audio_url || next.r2_key || "");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#13141c]">
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Your Library</h1>

        {/* Search & Sort */}
        <div className="flex gap-2 mb-3 relative">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#232430] border border-gray-700/40">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find in library"
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            className="px-3 rounded-lg bg-[#232430] border border-gray-700/40 text-sm text-gray-300 flex items-center gap-1.5 hover:bg-[#2c2d3a]"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort
          </button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-lg bg-[#232430] border border-gray-700/60 shadow-xl overflow-hidden">
              {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setSortMode(m);
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${
                    sortMode === m ? "text-purple-300" : "text-gray-300"
                  }`}
                >
                  {SORT_LABELS[m]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kelompok / filter chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(category === c.key ? null : c.key)}
              className={`px-3 py-0.5 rounded text-sm border transition-all ${c.style} ${
                category === c.key ? "ring-2 ring-white/60" : "opacity-70 hover:opacity-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-[#181924]/60 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-300 px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/20">
              <AlertCircle className="w-4 h-4" />
              <span>[ {error} ]</span>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center text-center py-10 text-gray-500">
              <Music className="w-8 h-8 mb-2" />
              <p className="text-sm">
                {sounds.length === 0 ? "No saved sounds yet" : "No sounds match your search"}
              </p>
            </div>
          )}

          <ul className="space-y-1">
            {pageItems.map((s) => {
              const active = player.playingId === s.id;
              return (
                <li
                  key={s.id}
                  onClick={() => router.push(`/play/${s.id}`)}
                  className={`flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer ${
                    active ? "bg-white/5" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm text-gray-100 truncate">{s.title}</p>
                      <p className="text-[10px] text-gray-500 capitalize">
                        {(s.sound_type || "").replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      player.toggle(s.id, s.r2_audio_url || s.r2_key || "");
                    }}
                    aria-label={active && player.isPlaying ? "Pause" : "Play"}
                    className="p-2 text-gray-300 hover:text-purple-300 transition-colors"
                  >
                    {active && player.isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Now playing bar */}
        {nowPlaying && (
          <div
            onClick={() => router.push(`/play/${nowPlaying.id}`)}
            className="mt-4 p-3 rounded-xl bg-[#232638] hover:bg-[#2a2e44] transition-colors flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-gray-100 truncate">{nowPlaying.title}</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-purple-400 transition-all"
                  style={{ width: `${player.progress}%` }}
                />
              </div>
              {player.error && (
                <p className="text-[10px] text-red-300 mt-1">[ {player.error} ]</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                player.toggle(nowPlaying.id, nowPlaying.r2_audio_url || nowPlaying.r2_key || "");
              }}
              aria-label={player.isPlaying ? "Pause" : "Play"}
              className="cursor-pointer p-1 text-gray-200 hover:text-purple-300"
            >
              {player.isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }}
              aria-label="Next"
              className="cursor-pointer p-1 text-gray-200 hover:text-purple-300"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-300">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded-full ${
                  n === currentPage ? "border border-gray-300 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

