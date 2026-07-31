import { agentGraph } from "../graph/graph.js";
import chatApi from "../utils/axios.js";
import { getConversationHistory } from "../utils/getMessages.js";
import { appendMessagesToCache } from "../config/memory.js";
import { getSignedUrlForKey } from "../../../shared/s3/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";

// Valid agent names for server-side validation of agentOverride
const VALID_AGENTS = ["chat", "search", "coding", "pdf", "ppt", "image"];

/**
 * POST /prompt
 * Fetches recent chat history, checks credits, invokes the multi-agent graph,
 * saves messages to chat service (MongoDB), updates Redis memory cache, deducts credits, and returns response.
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

    // Validate agentOverride server-side
    let validatedOverride = null;
    if (agentOverride && VALID_AGENTS.includes(agentOverride)) {
      validatedOverride = agentOverride;
    } else if (agentOverride) {
      console.warn(
        `[Controller] Invalid agentOverride "${agentOverride}" from client — falling back to auto`
      );
    }

    // ─── 1. Fetch recent conversation history ─────────────────────
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

    // ─── 4. Check if creditCheckNode flagged insufficient credits ──
    if (result.creditCheckFailed) {
      // Pre-check failed: no agent node ran, skip saving assistant message & deduction
      return res.status(200).json({
        response: result.response,
        selectedAgent: result.selectedAgent || "chat",
        conversationId,
        creditCheckFailed: true,
      });
    }

    // ─── 5. Save assistant response to chat service (MongoDB) ─────
    let assistantMsgSaved = false;
    try {
      await chatApi.post(
        "/message",
        {
          conversationId,
          role: "assistant",
          content: result.response,
          agentType: result.selectedAgent,
          searchImages: result.searchResults?.images || [],
          artifactTitle: result.artifactTitle || null,
          artifactFiles: result.artifactFiles || [],
          generatedImageKey: result.generatedImageKey || null,
          generatedPdfKey: result.generatedPdfKey || null,
          pdfTitle: result.pdfTitle || null,
          generatedPptKey: result.generatedPptKey || null,
          pptTitle: result.pptTitle || null,
        },
        { headers: { "x-user-id": userId } }
      );
      assistantMsgSaved = true;
    } catch (saveError) {
      console.error("Failed to save assistant message to chat service:", saveError.message);
    }

    // ─── 6. Update Redis memory cache ─────────────────────────────
    if (userMsgSaved && assistantMsgSaved) {
      await appendMessagesToCache(conversationId, [
        { role: "user", content: userPrompt },
        {
          role: "assistant",
          content: result.response,
          agentType: result.selectedAgent,
        },
      ]);
    } else {
      console.warn("Skipping Redis cache update due to failed MongoDB persistence");
    }

    // ─── 7. Post-execution credit deduction ────────────────────────
    let remainingCredits = null;
    const deductRes = await deductCredits(userId, result.selectedAgent);
    if (deductRes && typeof deductRes.remainingCredits === "number") {
      remainingCredits = deductRes.remainingCredits;
    }

    // ─── 8. Generate presigned URLs for immediate display ─────────
    let generatedImageUrl = null;
    if (result.generatedImageKey) {
      try {
        generatedImageUrl = await getSignedUrlForKey(result.generatedImageKey, 3600);
      } catch (err) {
        console.error("Failed to presign image key:", err.message);
      }
    }

    let generatedPdfUrl = null;
    if (result.generatedPdfKey) {
      try {
        generatedPdfUrl = await getSignedUrlForKey(result.generatedPdfKey, 3600);
      } catch (err) {
        console.error("Failed to presign PDF key:", err.message);
      }
    }

    let generatedPptUrl = null;
    if (result.generatedPptKey) {
      try {
        generatedPptUrl = await getSignedUrlForKey(result.generatedPptKey, 3600);
      } catch (err) {
        console.error("Failed to presign PPT key:", err.message);
      }
    }

    // ─── 9. Return result to client ───────────────────────────────
    return res.status(200).json({
      response: result.response,
      selectedAgent: result.selectedAgent,
      conversationId,
      remainingCredits,
      searchImages: result.searchResults?.images || [],
      artifactTitle: result.artifactTitle || null,
      artifactFiles: result.artifactFiles || [],
      generatedImageUrl,
      generatedPdfUrl,
      pdfTitle: result.pdfTitle || null,
      generatedPptUrl,
      pptTitle: result.pptTitle || null,
      ...(result.error && { warning: "Partial error occurred: " + result.error }),
    });
  } catch (error) {
    console.error("handlePrompt error:", error);
    return res.status(500).json({
      message: "Something went wrong processing your request",
    });
  }
};
