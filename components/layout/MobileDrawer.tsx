"use client";

import { X, Home, User, Bookmark, Settings, HelpCircle, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const navItems = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Profile", href: "/profile", icon: User },
    { label: "Library", href: "/library", icon: Bookmark },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Help", href: "/help", icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative w-4/5 max-w-xs bg-[#191a24] text-gray-200 h-full p-6 flex flex-col justify-between z-10 shadow-2xl border-r border-gray-800/50">
        <div>
          {/* Header Drawer */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={onClose} 
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-xs text-purple-400 font-bold">~||~</span>
          </div>

          {/* User Profile Info / Login Card */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-800">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-700 border border-purple-500/30 flex-shrink-0">
              <img 
                src="https://via.placeholder.com/56" 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="overflow-hidden">
              <h3 className="font-semibold text-white text-base truncate">
                [ {user ? user.username : "Guest"} ]
              </h3>
              <p className="text-xs text-gray-400 truncate">
                [ {user ? user.sub.slice(0, 8) + "..." : "Not logged in"} ]
              </p>
            </div>
          </div>

          {/* Menu Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800/60 hover:text-white transition-all text-sm font-medium"
                >
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer & Logout / Login Action */}
        <div className="pt-4 border-t border-gray-800/60 flex flex-col gap-3">
          {user ? (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          ) : (
            <Link
              href="/auth"
              onClick={onClose}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-sm font-medium transition-colors justify-center"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}

          <div className="text-[10px] text-gray-500 text-center">
            build [ v1.0.0 ]
          </div>
        </div>
      </div>
    </div>
  );
}