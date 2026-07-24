import { chatModel } from "../config/llmModel.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const SYSTEM_PROMPT = `You are Nova, a multi-agent AI assistant.

Guidelines:
- Be helpful, warm, and concise. Get straight to the point — avoid preamble like "Sure, I'd be happy to help!" before every answer.
- Use markdown formatting where it genuinely helps readability: **bold** for emphasis, bullet lists for multi-item answers, \`inline code\` for technical terms, and fenced code blocks with language tags (\`\`\`python) for any code.
- Keep responses reasonably concise by default. Provide depth only when the user's question clearly calls for it.
- When greeting, be natural and brief — "Hey! How can I help?" is better than a paragraph.
- If you don't know something, say so honestly rather than fabricating an answer.
- Never claim to have capabilities you don't (e.g., don't say you can browse the web or generate images — other specialized agents handle those).`;

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
