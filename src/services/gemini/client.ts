import { GoogleGenAI } from "@google/genai";

import { serverEnv } from "@/config/env.server";

/**
 * Cliente Gemini único para todo el servidor (embeddings, generación
 * de tests…). Los llamadores comprueban antes que la API key existe y
 * lanzan su propio error de dominio si falta.
 */
let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: serverEnv.geminiApiKey });
  return client;
}
