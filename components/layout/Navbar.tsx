"use client";

import { useState, useEffect } from "react";
import { Menu, Activity, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onResetHome?: () => void; // Prop opsional untuk reset status ke tampilan utama
}

export default function Navbar({ onOpenMobileMenu, onResetHome }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: "Home", href: "/home" },
    { label: "Profile", href: "/profile" },
    { label: "Library", href: "/library" },
    { label: "Settings", href: "/settings" },
    { label: "Help", href: "/help" },
  ];

  return (
    <header className="w-full px-4 md:px-12 py-4 flex items-center justify-between relative z-20">
      {/* 1. POJOK KIRI: Hamburger Mobile & Title Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger Button untuk HP */}
        <button 
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-gray-300 hover:text-white transition-colors -ml-1"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand Title Gambar (Diklik untuk balik ke tampilan awal Home) */}
        <Link href="/home" onClick={onResetHome} className="flex items-center gap-2">
          <img 
            src="/adaptive-soundscape.svg" 
            alt="Adaptive SoundScape" 
            className="h-5 md:h-6 w-auto object-contain"
          />
        </Link>
      </div>

      {/* 2. POSISI TENGAH: 5 Menu Navigasi */}
      <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={link.label === "Home" ? onResetHome : undefined}
            className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* 3. POJOK KANAN: Status Auth & Waveform Logo */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Render area Auth jika sudah mounted */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && user ? (
            <>
              <span className="text-sm font-medium text-purple-300 bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-500/20">
                [ {user.username} ]
              </span>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : mounted && !user ? (
            <Link href="/auth">
              <button className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                Login
              </button>
            </Link>
          ) : null}
        </div>

        {/* Logo Waveform Header (Diklik untuk balik ke tampilan awal Home) */}
        <Link 
          href="/home" 
          onClick={onResetHome} 
          className="w-12 h-12 flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          <img 
            src="/logo.svg" 
            alt="Adaptive SoundScape Logo" 
            className="w-12 h-12 object-contain" 
          />
        </Link>
      </div>
    </header>
  );
}