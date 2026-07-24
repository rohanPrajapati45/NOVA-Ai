import { agentGraph } from "../graph/graph.js";
import chatApi from "../utils/axios.js";
import { getConversationHistory } from "../utils/getMessages.js";
import { appendMessagesToCache } from "../config/memory.js";

// Valid agent names for server-side validation of agentOverride
const VALID_AGENTS = ["chat", "search", "coding", "pdf", "ppt", "image"];

/**
 * POST /prompt
 * Fetches recent chat history, invokes the multi-agent graph with conversational context,
 * saves messages to chat service (MongoDB), updates Redis memory cache, and returns response.
 */
export const handlePrompt = async (req, res) => {
  try {
    const { userPrompt, conversationId, agentOverride } = req.body;
    const userId = req.userId;

    // ─── Validate inputs ──────────────────────────────────────────
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!userPrompt) {
      return res.status(400).json({ message: "userPrompt is required" });
    }
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    // Validate agentOverride server-side — if invalid, silently fall back to null (auto-classify)
    let validatedOverride = null;
    if (agentOverride && VALID_AGENTS.includes(agentOverride)) {
      validatedOverride = agentOverride;
    } else if (agentOverride) {
      console.warn(
        `[Controller] Invalid agentOverride "${agentOverride}" from client — falling back to auto`
      );
    }

    // ─── 1. Fetch recent conversation history (Cache-Aside: Redis -> Mongo) ─────
    const chatHistory = await getConversationHistory(conversationId, userId);

    // ─── 2. Save user message to chat service (MongoDB) ───────────
    let userMsgSaved = false;
    try {
      await chatApi.post(
        "/message",
        { conversationId, role: "user", content: userPrompt },
        { headers: { "x-user-id": userId } }
      );
      userMsgSaved = true;
    } catch (saveError) {
      console.error("Failed to save user message to chat service:", saveError.message);
    }

    // ─── 3. Invoke LangGraph workflow with conversation context ───
    const result = await agentGraph.invoke({
      userPrompt,
      conversationId,
      userId,
      chatHistory,
      agentOverride: validatedOverride,
    });

    // ─── 4. Save assistant response to chat service (MongoDB) ─────
    let assistantMsgSaved = false;
    try {
      await chatApi.post(
        "/message",
        {
          conversationId,
          role: "assistant",
          content: result.response,
          agentType: result.selectedAgent,
          // Include search images if the search agent produced them
          searchImages: result.searchResults?.images || [],
        },
        { headers: { "x-user-id": userId } }
      );
      assistantMsgSaved = true;
    } catch (saveError) {
      console.error("Failed to save assistant message to chat service:", saveError.message);
    }

    // ─── 5. Update Redis memory cache ─────────────────────────────
    if (userMsgSaved && assistantMsgSaved) {
      await appendMessagesToCache(conversationId, [
        { role: "user", content: userPrompt },
        { role: "assistant", content: result.response, agentType: result.selectedAgent },
      ]);
    } else {
      console.warn("Skipping Redis cache update due to failed MongoDB persistence");
    }

    // ─── 6. Return result to client ───────────────────────────────
    return res.status(200).json({
      response: result.response,
      selectedAgent: result.selectedAgent,
      conversationId,
      // Include search images in the API response so the frontend can render them
      // immediately (without waiting for a message re-fetch)
      searchImages: result.searchResults?.images || [],
      ...(result.error && { warning: "Partial error occurred: " + result.error }),
    });
  } catch (error) {
    console.error("handlePrompt error:", error);
    return res.status(500).json({
      message: "Something went wrong processing your request",
    });
  }
};
