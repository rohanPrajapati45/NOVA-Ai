// TODO: Wire a real image generation API here.
// Options:
//   - OpenAI DALL-E (via openai npm package)
//   - Stability AI (via stability-rest API)
//   - Google Gemini Imagen (if/when available in @langchain/google-genai)
//
// Chat LLMs (Groq/Gemini) CANNOT generate images — they only produce text.
// This agent needs a dedicated image-generation API endpoint.
//
// When wired, the flow will be:
//   1. Parse the user's prompt to extract image description
//   2. Call the image generation API with the description
//   3. Store the generated image URL/blob
//   4. Return the URL in state.response for the frontend to render

/**
 * Image agent node — handles image generation requests.
 * STUB: Returns a placeholder response explaining that image generation
 * is not yet available. The interface is complete and ready to wire.
 */
export const imageAgent = async (state) => {
  try {
    return {
      response:
        "🖼️ Image generation is not available yet. " +
        "This feature will be connected to an image generation API (e.g. DALL-E, Stability AI) " +
        "in a future update. Your request was: \"" +
        state.userPrompt +
        '"',
    };
  } catch (error) {
    console.error("Image agent error:", error.message);
    return {
      response: "I'm sorry, image generation is not available yet.",
      error: error.message,
    };
  }
};
