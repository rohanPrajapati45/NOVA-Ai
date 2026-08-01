import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getSignedUrlForKey } from "../../../shared/s3/getFromS3.js";
import { refreshFileUrlsOnMessages } from "../utils/refreshFileUrls.js";

/**
 * GET /conversations
 * Fetch all conversations for the authenticated user, sorted by most recent activity first.
 * Returns empty array if user has no conversations (not an error).
 */
export const getUserConversations = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversations = await Conversation.find({ userId: req.userId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .select("-__v");

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error("getUserConversations error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /conversation
 * Create a new conversation for the authenticated user.
 */
export const createConversation = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title } = req.body;

    const conversation = await Conversation.create({
      userId: req.userId,
      title: title || "New Conversation",
    });

    return res.status(201).json({ conversation });
  } catch (error) {
    console.error("createConversation error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /conversation/:conversationId
 * Update a conversation (e.g. title). Validates ownership.
 */
export const updateConversation = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId format" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden — not your conversation" });
    }

    // Apply partial update — only fields provided in the body
    const allowedFields = ["title"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: updates },
      { new: true }
    );

    return res.status(200).json({ conversation: updated });
  } catch (error) {
    console.error("updateConversation error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /conversation/:conversationId
 * Deletes a conversation and all its messages.
 * Cascading cleanup: best-effort deletes S3 objects & Qdrant vector collection.
 */
export const deleteConversation = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId format" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden — not your conversation" });
    }

    // ─── 1. Find all messages & collect S3 keys ────────────────────
    const messages = await Message.find({ conversationId }).lean();

    const s3KeysToDelete = [];
    for (const msg of messages) {
      if (msg.generatedImageKey) s3KeysToDelete.push(msg.generatedImageKey);
      if (msg.generatedPdfKey) s3KeysToDelete.push(msg.generatedPdfKey);
      if (msg.generatedPptKey) s3KeysToDelete.push(msg.generatedPptKey);
    }

    // ─── 2. Delete DB records ─────────────────────────────────────
    await Message.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    console.log(`[ChatController] Deleted conversation ${conversationId} and ${messages.length} messages.`);

    // ─── 3. Best-effort S3 file cleanup ───────────────────────────
    if (s3KeysToDelete.length > 0) {
      (async () => {
        try {
          const { deleteFromS3 } = await import("../../../shared/s3/deleteFromS3.js");
          for (const key of s3KeysToDelete) {
            try {
              await deleteFromS3(key);
            } catch (err) {
              console.warn(`[ChatController Cleanup Warning] Failed to delete S3 key ${key}:`, err.message);
            }
          }
        } catch (s3ImportErr) {
          console.warn("[ChatController Cleanup Warning] S3 delete utility error:", s3ImportErr.message);
        }
      })();
    }

    // ─── 4. Best-effort Qdrant vector collection cleanup ───────────
    (async () => {
      try {
        const axios = (await import("axios")).default;
        const agentUrl = process.env.AGENT_SERVICE_URL || "http://localhost:8003";
        await axios.delete(`${agentUrl}/internal/qdrant/${conversationId}`);
        console.log(`[ChatController] Best-effort Qdrant collection deleted for ${conversationId}`);
      } catch (qdrantErr) {
        console.warn(`[ChatController Cleanup Warning] Qdrant cleanup failed for ${conversationId}:`, qdrantErr.message);
      }
    })();

    return res.status(200).json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("deleteConversation error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /message
 * Save a new message to a conversation. Validates ownership.
 */
export const saveMessage = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId, role, content, agentType, searchImages, artifactTitle, artifactFiles, generatedImageKey } = req.body;

    // Validate required fields
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }
    if (!role) {
      return res.status(400).json({ message: "role is required" });
    }
    if (!content) {
      return res.status(400).json({ message: "content is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId format" });
    }

    // Check conversation exists
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Ownership check
    if (conversation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden — not your conversation" });
    }

    // Create the message — agentType, searchImages, artifact fields all optional
    const message = await Message.create({
      conversationId,
      role,
      content,
      ...(agentType ? { agentType } : {}),
      ...(searchImages && Array.isArray(searchImages) && searchImages.length > 0
        ? { searchImages }
        : {}),
      ...(artifactTitle ? { artifactTitle } : {}),
      ...(artifactFiles && Array.isArray(artifactFiles) && artifactFiles.length > 0
        ? { artifactFiles }
        : {}),
      ...(generatedImageKey ? { generatedImageKey } : {}),
    });

    // Update parent conversation's lastMessageAt
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.status(201).json({ message });
  } catch (error) {
    console.error("saveMessage error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /message/:conversationId
 * Fetch all messages for a conversation, sorted oldest-first. Validates ownership.
 */
export const getMessagesByConversation = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId format" });
    }

    // Check conversation exists
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Ownership check
    if (conversation.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Forbidden — not your conversation" });
    }

    // Fetch messages sorted by createdAt ascending (natural chat order)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .select("-__v")
      .lean(); // Use lean() for plain JS objects we can mutate

    // Generate fresh presigned URLs for all S3-stored files (images, PDFs, PPTs)
    await refreshFileUrlsOnMessages(messages);

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("getMessagesByConversation error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
