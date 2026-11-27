"use client";

import { useState } from "react";
import { FileText, Download, Plus, Minus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";

const USER_MANUAL_PATH = "/Adaptive%20SoundScape%20-%20User%20Manual.pdf";
const USER_MANUAL_FILENAME = "Adaptive SoundScape - User Manual.pdf";

const FAQS = [
  {
    id: "record",
    question: "How do I record and generate a custom soundscape?",
    answer:
      "Tap the microphone button on the Home page to start recording ambient sound (minimum 2 seconds, maximum 30 seconds). Tap again to stop, choose a sound profile (Default Noise, Rain, Sea Waves, Wind, or Water Stream), then tap the magnifying glass icon to analyze and generate your soundscape.",
  },
  {
    id: "save",
    question: "Do I need an account to save sounds to my Library?",
    answer:
      "You can record and preview analyzed soundscapes without logging in, but saving soundscapes to your Library requires an account.",
  },
  {
    id: "default-profile",
    question: "How do I change my default sound profile?",
    answer:
      "Open the Settings page, select your preferred sound profile under Your default profile, and click Save changes.",
  },
  {
    id: "delete",
    question: "How do I remove saved sounds from my Library?",
    answer:
      "Click the trash icon next to any sound in your Library, Top Profiles, or on the Play page. To clear everything at once, use Reset in Settings.",
  },
];

export default function HelpPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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

      <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-indigo-100 mb-2">
          Help Center
        </h1>

        {/* User Manual */}
        <Divider title="User Manual" />
        <div className="w-full p-5 rounded-2xl bg-[#1d1e29] border border-gray-700/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-200 leading-relaxed">
              Need a complete guide? Download the user manual{" "}
              <a
                href={USER_MANUAL_PATH}
                download={USER_MANUAL_FILENAME}
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 inline-flex items-center gap-1"
              >
                here
                <Download className="w-3.5 h-3.5 inline" />
              </a>
              .
            </p>
            <p className="text-[11px] text-gray-500 mt-1 truncate">
              {USER_MANUAL_FILENAME}
            </p>
          </div>
        </div>

        {/* FAQ */}
        <Divider title="FAQ" />
        <ul className="w-full px-1 space-y-1">
          {FAQS.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="border-b border-gray-800/70 py-1">
                <button
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="w-full flex items-center justify-between text-left text-sm text-gray-200 py-2 hover:text-white transition-colors"
                >
                  <span className="pr-4">{item.question}</span>
                  {open ? (
                    <Minus className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  ) : (
                    <Plus className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {open && (
                  <p className="text-xs text-gray-400 pl-3 pb-3 border-l border-gray-700 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
