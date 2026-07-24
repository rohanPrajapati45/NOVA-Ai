import { pdfModel } from "../config/llmModel.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// TODO: Wire RAG pipeline here (e.g. Qdrant vector store + PDF parser)
// When wired, the flow will be:
//   1. User uploads a PDF → it gets parsed, chunked, and embedded into Qdrant
//   2. On each query, relevant chunks are retrieved from the vector store
//   3. Retrieved context is injected into {retrievedContext} below
//   4. The pdfModel answers based on the retrieved context + user question
// For now, this agent responds based on the LLM's general knowledge only.

const SYSTEM_PROMPT = `You are a document analysis AI assistant specialized in answering questions about PDF documents.

{retrievedContext}

Guidelines:
- Answer questions based on the document context provided above.
- If no document context is available, let the user know that no PDF has been uploaded yet,
  and offer to help once they provide a document.
- Be precise and quote relevant sections when possible.
- If the answer isn't in the provided context, say so honestly rather than guessing.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "{userPrompt}"],
]);

/**
 * PDF agent node — handles document-related questions.
 * STUBBED: No RAG/Qdrant pipeline is wired yet. Uses LLM knowledge only.
 * Uses Gemini 1.5 Flash for its 1M token context window.
 */
export const pdfAgent = async (state) => {
  try {
    // TODO: Replace this with actual retrieved context from Qdrant
    const retrievedContext =
      "Note: No PDF document has been uploaded or indexed yet. " +
      "The RAG pipeline will be connected in a future update.";

    const chain = prompt.pipe(pdfModel);
    const result = await chain.invoke({
      userPrompt: state.userPrompt,
      retrievedContext,
    });

    return { response: result.content };
  } catch (error) {
    console.error("PDF agent error:", error.message);
    return {
      response: "I'm sorry, I couldn't process your document request. Please try again.",
      error: error.message,
    };
  }
};
