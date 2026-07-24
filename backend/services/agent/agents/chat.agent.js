import { chatModel } from "../config/llmModel.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const SYSTEM_PROMPT = `You are NOVA, a friendly and helpful AI assistant.
You engage in natural conversation, answer questions clearly, and provide thoughtful responses.
Keep your answers concise but informative. Be warm and approachable.
If the user greets you, greet them back warmly.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "{userPrompt}"],
]);

/**
 * Chat agent node — handles general conversation.
 * Also used as the first hop in the search flow (to reformulate queries).
 */
export const chatAgent = async (state) => {
  try {
    const chain = prompt.pipe(chatModel);
    const result = await chain.invoke({ userPrompt: state.userPrompt });

    // If this is the search flow (chat → search), store output as intermediate step
    if (state.selectedAgent === "search") {
      return {
        intermediateSteps: [{ agent: "chat", output: result.content }],
      };
    }

    return { response: result.content };
  } catch (error) {
    console.error("Chat agent error:", error.message);
    return {
      response: "I'm sorry, something went wrong. Please try again.",
      error: error.message,
    };
  }
};
