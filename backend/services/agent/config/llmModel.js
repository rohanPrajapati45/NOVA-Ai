import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// ─── Groq Models ────────────────────────────────────────────────────

/**
 * Router model — fastest/cheapest, runs on every request.
 * Only classifies the prompt into one of 6 agent categories.
 */
export const routerModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0, // Deterministic classification
});

/**
 * Chat model — fast conversational replies.
 */
export const chatModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.7,
});

/**
 * Search model — summarizing search-augmented results.
 * Uses same fast model since the heavy lifting is in the search tool (future).
 */
export const searchModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.5,
});

/**
 * Coding model — stronger reasoning for code generation/debugging.
 * Uses the larger 70B model for better code quality.
 */
export const codingModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.2, // More deterministic for code
});

// ─── Gemini Models ──────────────────────────────────────────────────

/**
 * PDF model — large context window for document Q&A.
 * Gemini 1.5 Flash has a 1M token context window, ideal for RAG-style PDF answering.
 */
export const pdfModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-1.5-flash",
  temperature: 0.3,
});

/**
 * PPT model — reasoning + structure for slide content generation.
 * Uses Gemini for its strong structured output and reasoning capabilities.
 */
export const pptModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-1.5-flash",
  temperature: 0.5,
});

// ─── Image Model ────────────────────────────────────────────────────
// NOTE: Image generation requires a dedicated image API (e.g. OpenAI DALL-E,
// Stability AI, or Gemini Imagen). Chat LLMs (Groq/Gemini) cannot generate images.
// No model is exported here — image.agent.js is a stub for now.
