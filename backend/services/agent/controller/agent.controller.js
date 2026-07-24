import { agentGraph } from "../graph/graph.js";
import chatApi from "../utils/axios.js";

/**
 * POST /prompt
 * Invokes the multi-agent graph, saves messages to chat service, returns response.
 */
export const handlePrompt = async (req, res) => {
  try {
    const { userPrompt, conversationId } = req.body;
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

    // ─── Save the user's message to chat service ──────────────────
    try {
      await chatApi.post(
        "/message",
        { conversationId, role: "user", content: userPrompt },
        { headers: { "x-user-id": userId } }
      );
    } catch (saveError) {
      console.error("Failed to save user message:", saveError.message);
      // Continue with graph execution even if save fails — we still want to respond
    }

    // ─── Invoke the LangGraph workflow ────────────────────────────
    const result = await agentGraph.invoke({
      userPrompt,
      conversationId,
      userId,
    });

    // ─── Save the assistant's response to chat service ────────────
    try {
      await chatApi.post(
        "/message",
        { conversationId, role: "assistant", content: result.response },
        { headers: { "x-user-id": userId } }
      );
    } catch (saveError) {
      console.error("Failed to save assistant message:", saveError.message);
      // Still return the response to the client
    }

    // ─── Return result to client ──────────────────────────────────
    return res.status(200).json({
      response: result.response,
      selectedAgent: result.selectedAgent,
      conversationId,
      ...(result.error && { warning: "Partial error occurred: " + result.error }),
    });
  } catch (error) {
    console.error("handlePrompt error:", error);
    return res.status(500).json({
      message: "Something went wrong processing your request",
    });
  }
};
