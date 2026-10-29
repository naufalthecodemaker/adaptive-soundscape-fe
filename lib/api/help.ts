import { fetchAPI } from "./client";
import { ApiResponse } from "@/types/api";

export interface HelpQuestion {
  id: string;
  question: string;
  answer?: string | null; // jawaban dari admin, null jika belum dijawab
}

/**
 * GET /api/help/questions  (butuh endpoint backend: belum tersedia di API saat ini)
 * mengambil semua pertanyaan user beserta jawaban admin
 */
export async function getHelpQuestions() {
  return fetchAPI<ApiResponse<HelpQuestion[]>>("api/help/questions", {
    method: "GET",
  });
}

/**
 * POST /api/help/questions  (butuh endpoint backend: belum tersedia di API saat ini)
 * mengirim pertanyaan baru dari user
 */
export async function submitHelpQuestion(question: string) {
  return fetchAPI<ApiResponse<HelpQuestion>>("api/help/questions", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

