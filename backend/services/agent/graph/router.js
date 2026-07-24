import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { routerModel } from "../config/llmModel.js";

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

Classify the user's message into exactly one category. When in doubt, choose "chat".`;

const routerPrompt = ChatPromptTemplate.fromMessages([
  ["system", ROUTER_SYSTEM_PROMPT],
  ["human", "{userPrompt}"],
]);

// Create the structured model — enforces output matches the Zod schema
const structuredRouterModel = routerModel.withStructuredOutput(routerSchema, {
  name: "route_classifier",
});

/**
 * Router node for the LangGraph workflow.
 * Classifies the user prompt and sets state.selectedAgent.
 */
export const routerNode = async (state) => {
  try {
    const chain = routerPrompt.pipe(structuredRouterModel);
    const result = await chain.invoke({ userPrompt: state.userPrompt });

    // Validate the result is one of our valid agents
    const validAgents = ["chat", "search", "coding", "pdf", "ppt", "image"];
    const selected = validAgents.includes(result.selectedAgent)
      ? result.selectedAgent
      : "chat"; // Safe fallback

    if (!validAgents.includes(result.selectedAgent)) {
      console.warn(
        `Router returned unexpected agent "${result.selectedAgent}", falling back to "chat"`
      );
    }

    return { selectedAgent: selected };
  } catch (error) {
    console.error("Router classification failed:", error.message);
    // Default to chat agent on any error — safest fallback
    return { selectedAgent: "chat", error: error.message };
  }
};
