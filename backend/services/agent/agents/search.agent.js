import { searchModel } from "../config/llmModel.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// TODO: Wire a real web search tool here (e.g. Tavily, Serper, or Google Custom Search)
// When wired, the flow will be:
//   1. Chat agent reformulates the query (intermediate step)
//   2. This agent calls the search API with the reformulated query
//   3. Summarizes search results using the searchModel
// For now, this agent responds based on the LLM's training data only.

const SYSTEM_PROMPT = `You are a search-augmented AI assistant.
Your role is to provide informative answers to questions that might require current or factual information.

IMPORTANT: You do NOT have access to live web search results yet.
If the question requires real-time data (stock prices, current news, live scores), 
honestly state that you cannot access live information at the moment, but provide 
the best answer you can from your training knowledge.

Be factual, cite reasoning, and clearly distinguish between what you know and what you're uncertain about.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "Previous context: {intermediateContext}\n\nUser question: {userPrompt}"],
]);

/**
 * Search agent node — handles questions requiring current/live information.
 * STUBBED: No real search tool is wired yet. Uses LLM knowledge only.
 * This is the second hop in the search flow: router → chat agent → search agent.
 */
export const searchAgent = async (state) => {
  try {
    // Get context from the chat agent's intermediate step (first hop)
    const intermediateContext =
      state.intermediateSteps
        ?.filter((s) => s.agent === "chat")
        .map((s) => s.output)
        .join("\n") || "No prior context.";

    const chain = prompt.pipe(searchModel);
    const result = await chain.invoke({
      userPrompt: state.userPrompt,
      intermediateContext,
    });

    return { response: result.content };
  } catch (error) {
    console.error("Search agent error:", error.message);
    return {
      response: "I'm sorry, I couldn't process your search request. Please try again.",
      error: error.message,
    };
  }
};
