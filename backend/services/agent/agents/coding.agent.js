import { codingModel } from "../config/llmModel.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const SYSTEM_PROMPT = `You are an expert coding assistant.
You help users write, debug, review, and explain code across all programming languages.

Guidelines:
- Write clean, well-commented, production-quality code.
- When debugging, explain what the bug is and why the fix works.
- When asked to explain code, break it down step by step.
- Use proper formatting: wrap code in markdown code blocks with language tags.
- If the request is ambiguous, ask for clarification about language/framework preferences.
- Consider edge cases, error handling, and best practices in your solutions.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "{userPrompt}"],
]);

/**
 * Coding agent node — handles code-related questions.
 * Uses the larger llama-3.3-70b-versatile model for stronger reasoning.
 */
export const codingAgent = async (state) => {
  try {
    const chain = prompt.pipe(codingModel);
    const result = await chain.invoke({ userPrompt: state.userPrompt });

    return { response: result.content };
  } catch (error) {
    console.error("Coding agent error:", error.message);
    return {
      response: "I'm sorry, I couldn't process your coding request. Please try again.",
      error: error.message,
    };
  }
};
