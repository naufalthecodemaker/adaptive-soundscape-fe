"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, X, AlertTriangle, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, deleteAccount } from "@/lib/api";

const CONFIRM_PHRASE = "DELETE";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, setUser, refreshUser } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Edit profile
  const [showEdit, setShowEdit] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Halaman profile hanya untuk user yang sudah login
  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/auth");
  }, [user, isAuthLoading, router]);

  const openEdit = () => {
    setUsername(user?.username ?? "");
    setEmail(user?.email ?? "");
    setEditError("");
    setShowEdit(true);
  };

  const handleSaveProfile = async () => {
    if (!username.trim() || !email.trim()) {
      setEditError("Username and email are required.");
      return;
    }
    setIsSaving(true);
    setEditError("");
    try {
      const res = await updateProfile({ username: username.trim(), email: email.trim() });
      if (!res.success) throw new Error(res.message || "Failed to update profile.");
      await refreshUser();
      setShowEdit(false);
    } catch (err: any) {
      setEditError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await deleteAccount();
      if (!res.success) throw new Error(res.message || "Failed to delete account.");
      setUser(null);
      router.push("/");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDelete = () => {
    setShowDelete(false);
    setConfirmText("");
    setDeleteError("");
  };

  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-GB") : "-";

  return (
    <div className="min-h-screen flex flex-col bg-[#13141c]">
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <main className="flex-1 w-full max-w-sm mx-auto px-6 py-8 flex flex-col items-center">
        {/* Avatar */}
        <div className="w-44 h-44 rounded-full border-4 border-[#6b72a8] bg-[#232430] flex items-center justify-center mb-8">
          <User className="w-20 h-20 text-gray-400" />
        </div>

        {/* Info */}
        <div className="w-full mb-10">
          <h1 className="text-2xl font-bold truncate">[ {user?.username ?? "Username"} ]</h1>
          <p className="text-xl font-bold truncate mt-1">[ {user?.email ?? "Email"} ]</p>
          <p className="text-[11px] text-gray-500 mt-1 truncate">[ {user?.sub ?? "User ID"} ]</p>
          <p className="text-[11px] text-gray-500">Joined since [ {joined} ]</p>
        </div>

        {/* Actions */}
        <button
          onClick={openEdit}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors mb-3"
        >
          Edit Profile
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
        >
          Delete Account
        </button>
      </main>

      {/* MODAL EDIT PROFILE */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xs p-6 rounded-2xl bg-[#1d1e29] border border-gray-700/50 shadow-2xl">
            <button
              onClick={() => setShowEdit(false)}
              aria-label="Close"
              className="absolute top-3 left-3 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-center font-semibold mb-5 mt-1">Edit Profile</h2>

            <label className="block text-xs text-gray-400 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-[#2a2b38] border border-gray-700/50 text-sm outline-none focus:border-blue-500"
            />
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-[#2a2b38] border border-gray-700/50 text-sm outline-none focus:border-blue-500"
            />

            {editError && (
              <div className="flex items-center gap-2 text-xs text-red-300 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>[ {editError} ]</span>
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DELETE ACCOUNT */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs p-6 rounded-2xl bg-[#241518] border border-red-500/30 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-4">
              <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
              <h2 className="font-semibold text-lg">Are you sure?</h2>
              <p className="text-xs text-gray-300 mt-2">
                Deleting your account is permanent. Your profile and all saved sounds in your
                library will be lost and cannot be recovered.
              </p>
            </div>

            <label className="block text-xs text-gray-400 mb-1">
              Type <span className="font-bold text-red-300">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-[#2f1c20] border border-red-500/30 text-sm outline-none focus:border-red-400"
            />

            {deleteError && (
              <div className="flex items-center gap-2 text-xs text-red-300 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>[ {deleteError} ]</span>
              </div>
            )}

            <button
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_PHRASE || isDeleting}
              className="w-full py-2 mb-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
            <button
              onClick={closeDelete}
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

