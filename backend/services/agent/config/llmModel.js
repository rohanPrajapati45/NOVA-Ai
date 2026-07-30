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

// ─── OpenRouter / Coding Model (Temporarily Disabled due to credit limit) ───
// import OpenAI from "openai";
// const openRouterClient = new OpenAI({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   baseURL: "https://openrouter.ai/api/v1",
//   defaultHeaders: {
//     "HTTP-Referer": "http://localhost:5173",
//     "X-Title": "NOVA AI",
//   },
// });

// ─── Groq Coding Model (Option A) ───────────────────────────────────

/**
 * Coding model — Fast, high-quality reasoning on Groq.
 * Uses Llama 3.3 70B Versatile for high-performance code generation/review.
 */
const groqCodingModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.2, // Lower temperature for deterministic code structure
  maxTokens: 2500,  // Standard max tokens for output size
});

/**
 * Call the Groq coding model.
 * @param {Array<{role: string, content: string}>} messages - OpenAI-format messages
 * @param {boolean} jsonMode - if true, sets response_format to json_object
 * @returns {Promise<string>} - the assistant's response content
 */
export const codingModelCall = async (messages, jsonMode = false) => {
  // Convert standard OpenAI roles/messages to format accepted by LangChain BaseChatModel
  const response = await groqCodingModel.invoke(
    messages,
    jsonMode ? { response_format: { type: "json_object" } } : {}
  );
  return response.content || "";
};

// ─── Image Model ────────────────────────────────────────────────────
// NOTE: Image generation requires a dedicated image API (e.g. OpenAI DALL-E,
// Stability AI, or Gemini Imagen). Chat LLMs (Groq/Gemini) cannot generate images.
// No model is exported here — image.agent.js is a stub for now.
