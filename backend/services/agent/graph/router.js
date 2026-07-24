import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { routerModel } from "../config/llmModel.js";

// Valid agent names — reused for both LLM classification and manual override validation
const VALID_AGENTS = ["chat", "search", "coding", "pdf", "ppt", "image"];

// Zod schema for structured output — forces the LLM to return exactly
// one of the 6 valid agent names. withStructuredOutput uses tool/function
// calling under the hood, so the output is validated automatically.
const routerSchema = z.object({
  selectedAgent: z
    .enum(["chat", "search", "coding", "pdf", "ppt", "image"])
    .describe("The name of the agent best suited to handle this user prompt"),
});

const ROUTER_SYSTEM_PROMPT = `You are a routing classifier for a multi-agent AI system.
Your ONLY job is to classify the user's message into exactly ONE of these 6 categories:

1. "chat" — General conversation, greetings, small talk, opinions, explanations of concepts, 
   anything that doesn't clearly fit another category.
   Examples: "hello", "how are you", "explain quantum computing", "tell me a joke"

2. "search" — Questions requiring current/live information, news, real-time data, prices, 
   latest events, or anything the user explicitly asks to search for.
   Examples: "what's the latest news about AI", "search for best restaurants in NYC", 
   "what is the current price of Bitcoin", "who won the game yesterday"

3. "coding" — Code-related questions, debugging, writing functions, explaining code, 
   reviewing code, or anything programming-related.
   Examples: "write a function that sorts an array", "debug this Python code", 
   "explain what this regex does", "convert this to TypeScript"

4. "pdf" — Questions that reference an uploaded PDF, document, or file, asking to 
   analyze, summarize, or answer questions about document content.
   Examples: "summarize this PDF", "what does page 5 say about revenue", 
   "extract key points from the uploaded document"

5. "ppt" — Requests to create a presentation, slides, or PowerPoint about a topic.
   Examples: "make a presentation about climate change", "create slides on machine learning",
   "build a 10-slide deck about our quarterly results"

6. "image" — Requests to generate, create, or draw an image or picture.
   Examples: "generate an image of a sunset", "create a picture of a cat wearing a hat",
   "draw a logo for my startup"

CONTINUITY RULE:
If the previous message in this conversation was handled by a specialized agent (e.g. "search", "coding", etc.) AND the current user message is a short follow-up, correction, or continuation of that same topic (e.g., "try again", "why is this wrong", "what about X instead", "give me the link to the first one") with no new distinct topic, classify it as the SAME agent as before, not "chat", unless the user has clearly moved to an unrelated topic.

Classify the user's message into exactly one category. When in doubt, choose "chat".`;

const routerPrompt = ChatPromptTemplate.fromMessages([
  ["system", ROUTER_SYSTEM_PROMPT],
  ["human", "Previous assistant agent: {lastAgentType}\nUser message: {userPrompt}"],
]);

// Create the structured model — enforces output matches the Zod schema
const structuredRouterModel = routerModel.withStructuredOutput(routerSchema, {
  name: "route_classifier",
});

/**
 * Router node for the LangGraph workflow.
 *
 * TWO PATHS:
 * 1. Manual override: if state.agentOverride is a valid agent string,
 *    skip the LLM call entirely and use the override directly.
 *    Saves latency/cost when the user already told us which agent to use.
 * 2. Auto-classify: run the LLM-based classification, passing previous agent context.
 */
export const routerNode = async (state) => {
  try {
    // ─── Path 1: Manual override from frontend ────────────────────
    if (state.agentOverride && VALID_AGENTS.includes(state.agentOverride)) {
      console.log(`[Router] Manual override: "${state.agentOverride}" (skipping LLM classification)`);
      return { selectedAgent: state.agentOverride };
    }

    // Warn if an invalid override value was somehow sent
    if (state.agentOverride && !VALID_AGENTS.includes(state.agentOverride)) {
      console.warn(
        `[Router] Invalid agentOverride "${state.agentOverride}" — falling back to auto-classification`
      );
    }

    // ─── Path 2: Auto-classify via LLM with Continuity Context ─────
    // Find the last assistant message's agentType in chatHistory
    let lastAgentType = "none";
    if (Array.isArray(state.chatHistory)) {
      for (let i = state.chatHistory.length - 1; i >= 0; i--) {
        const msg = state.chatHistory[i];
        if (msg.role === "assistant" && msg.agentType) {
          lastAgentType = msg.agentType;
          break;
        }
      }
    }

    const chain = routerPrompt.pipe(structuredRouterModel);
    const result = await chain.invoke({
      userPrompt: state.userPrompt,
      lastAgentType,
    });

    const selected = VALID_AGENTS.includes(result.selectedAgent)
      ? result.selectedAgent
      : "chat"; // Safe fallback

    if (!VALID_AGENTS.includes(result.selectedAgent)) {
      console.warn(
        `[Router] LLM returned unexpected agent "${result.selectedAgent}", falling back to "chat"`
      );
    }

    console.log(`[Router] Auto-classified: "${selected}"`);
    return { selectedAgent: selected };
  } catch (error) {
    console.error("Router classification failed:", error.message);
    // Default to chat agent on any error — safest fallback
    return { selectedAgent: "chat", error: error.message };
  }
};
