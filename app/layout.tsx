import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Adaptive SoundScape",
  description: "Adaptive SoundScape - Personalized Dynamic Sound Masking",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#13141c] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}