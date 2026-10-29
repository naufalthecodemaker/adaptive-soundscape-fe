"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { getHelpQuestions, submitHelpQuestion, HelpQuestion } from "@/lib/api";

export default function HelpPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const loadQuestions = async () => {
    try {
      const res = await getHelpQuestions();
      setQuestions(res.data ?? []);
    } catch {
      // Backend Help belum tersedia / gagal -> anggap belum ada pertanyaan
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setMessage({ type: "error", text: "Please write your question first." });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await submitHelpQuestion(text.trim());
      if (!res.success) throw new Error(res.message || "Failed to submit question.");
      setText("");
      setMessage({ type: "ok", text: "Your question has been sent." });
      await loadQuestions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit question." });
    } finally {
      setIsSubmitting(false);
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

      <main className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-indigo-100 mb-2">Help Center</h1>

        {/* FAQ */}
        <Divider title="FAQ" />
        <div className="w-full px-2">
          {isLoading && <div className="h-10 rounded bg-white/5 animate-pulse" />}

          {!isLoading && questions.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">No questions yet.</p>
          )}

          <ul>
            {questions.map((q) => {
              const open = openId === q.id;
              return (
                <li key={q.id} className="py-1">
                  <button
                    onClick={() => setOpenId(open ? null : q.id)}
                    className="w-full flex items-center justify-between text-left text-sm text-gray-200 py-1.5"
                  >
                    <span className="pr-4">{q.question}</span>
                    {open ? <Minus className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
                  </button>
                  {open && (
                    <p className="text-xs text-gray-400 pl-3 pb-2 border-l border-gray-700">
                      {q.answer ? q.answer : "Waiting for an answer from the admin."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Ask a question */}
        <Divider title="Ask a question" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your questions"
          rows={6}
          className="w-full p-4 rounded-xl bg-[#232430] border-2 border-gray-600/50 text-sm outline-none focus:border-indigo-400 placeholder-gray-500 resize-none"
        />

        {message && (
          <p
            className={`flex items-center gap-1.5 text-xs mt-3 ${
              message.type === "ok" ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {message.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 px-10 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {isSubmitting ? "Sending..." : "Submit"}
        </button>
      </main>
    </div>
  );
}

