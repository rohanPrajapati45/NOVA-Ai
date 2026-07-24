import { chatModel } from "../config/llmModel.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { formatChatHistory } from "../utils/formatChatHistory.js";

const SYSTEM_PROMPT = `You are Nova, a multi-agent AI assistant.

Guidelines:
- Be helpful, warm, and concise. Get straight to the point — avoid preamble like "Sure, I'd be happy to help!" before every answer.
- Maintain continuity with earlier parts of the conversation. Avoid re-introducing yourself or re-explaining things already covered earlier in the same conversation.
- Reference earlier context naturally when relevant (e.g. "as you mentioned earlier...") rather than treating every message as an isolated question.
- Use markdown formatting where it genuinely helps readability: **bold** for emphasis, bullet lists for multi-item answers, \`inline code\` for technical terms, and fenced code blocks with language tags (\`\`\`python) for any code.
- Keep responses reasonably concise by default. Provide depth only when the user's question clearly calls for it.
- If you don't know something, say so honestly rather than fabricating an answer.
- Never claim to have capabilities you don't (e.g., don't say you can browse the web or generate images — other specialized agents handle those).`;

// Note: Other agent files (coding, pdf, ppt, search, image) can adopt the same
// state.chatHistory + formatChatHistory pattern in a future step if needed.

/**
 * Chat agent node — handles general conversation with multi-turn memory context.
 * Also used as the first hop in the search flow (to reformulate queries).
 */
export const chatAgent = async (state) => {
  try {
    const formattedHistory = formatChatHistory(state.chatHistory || []);

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...formattedHistory,
      new HumanMessage(state.userPrompt),
    ];

    const result = await chatModel.invoke(messages);

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
