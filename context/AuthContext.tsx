"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "@/lib/api";
import { UserData } from "@/types/api";

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  setUser: (user: UserData | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_META_STORAGE_KEY = "adaptive_soundscape_user_meta";

// Data email & created_at asli dari tabel users di database untuk akun yang sudah terdaftar sebelum metadata disimpan di localStorage
const KNOWN_USERS_DB_META: Record<string, { email: string; created_at: string }> = {
  "f98cc851-82a2-4b0d-8f2d-c0dba1919829": { email: "d@gmailcom", created_at: "2026-10-29T00:53:29.373754Z" },
  "afaaf7eb-a0e7-4aaa-8d2f-dc87dc42f46a": { email: "ramid@gmail.com", created_at: "2026-10-27T13:58:31.649502Z" },
  "b33c394e-639b-4e8e-a0ef-89a0022c5327": { email: "jawir@gmail.com", created_at: "2026-10-28T13:59:47.051747Z" },
  "b00b7791-9ba3-4b82-b410-c9c64d4088a1": { email: "miguel@gmail.com", created_at: "2026-10-29T15:36:29.942809Z" },
  "78ac11da-76a2-4920-8411-4ae2a80fc82f": { email: "ema@gmail.com", created_at: "2026-10-30T10:32:32.440802Z" },
  "e56fb000-a4cb-43d9-86bb-9831e456dd48": { email: "dimar@gmail.com", created_at: "2026-10-27T15:54:42.099633Z" },
  "86f6a32b-9cf0-4b68-afed-47ca5c2b6681": { email: "dimar6767@gmail.com", created_at: "2026-11-04T12:21:20.610550Z" },
  "383399d0-bd3c-43b4-b42f-5396aada7d23": { email: "dimar10@gmail.com", created_at: "2026-11-04T14:08:35.111574Z" },
  "c9bee3ac-b55f-4c7d-a5c7-4e1e1a8bcc18": { email: "dimar1230@gmail.com", created_at: "2026-11-05T11:03:51.511638Z" },
  "35cb3d92-3a7d-4e4e-a18e-7978d581e5da": { email: "dimar12340@gmail.com", created_at: "2026-11-17T13:03:58.661357Z" },
  "59010899-d1ad-4202-8ec9-b73da9fe34cb": { email: "dimarasli@gmail.com", created_at: "2026-11-17T13:09:31.009363Z" },
  "4ff20771-2acd-4287-8344-c026aac892aa": { email: "raihan2031r@gmail.com", created_at: "2026-11-20T10:26:49.952960Z" },
  "82b47623-c610-4d74-81a2-20fb326c4985": { email: "sb14driprosya@gmail.com", created_at: "2026-11-23T04:37:29.130827Z" },
};

function mergeStoredUserMeta(user: UserData): UserData {
  if (typeof window === "undefined") return user;
  try {
    const raw = localStorage.getItem(USER_META_STORAGE_KEY);
    const allMeta: Record<string, { email?: string; created_at?: string }> = raw
      ? JSON.parse(raw)
      : {};
    const key = user.sub || user.username;
    const saved = allMeta[key] || allMeta[user.username] || {};
    const dbKnown = KNOWN_USERS_DB_META[user.sub];
    return {
      ...user,
      email: user.email || saved.email || dbKnown?.email,
      created_at: user.created_at || dbKnown?.created_at || saved.created_at,
    };
  } catch {
    const dbKnown = KNOWN_USERS_DB_META[user.sub];
    return {
      ...user,
      email: user.email || dbKnown?.email,
      created_at: user.created_at || dbKnown?.created_at,
    };
  }
}

export function saveLocalUserMeta(
  keyOrUsername: string,
  meta: { sub?: string; email?: string; created_at?: string }
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(USER_META_STORAGE_KEY);
    const allMeta: Record<string, { email?: string; created_at?: string }> = raw
      ? JSON.parse(raw)
      : {};
    const entry = {
      email: meta.email || allMeta[keyOrUsername]?.email,
      created_at: meta.created_at || allMeta[keyOrUsername]?.created_at,
    };
    allMeta[keyOrUsername] = entry;
    if (meta.sub) {
      allMeta[meta.sub] = {
        email: entry.email || allMeta[meta.sub]?.email,
        created_at: entry.created_at || allMeta[meta.sub]?.created_at,
      };
    }
    localStorage.setItem(USER_META_STORAGE_KEY, JSON.stringify(allMeta));
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const res = await getCurrentUser();
      if (res.success && res.data) {
        setUser(mergeStoredUserMeta(res.data));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.replace("/home");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
