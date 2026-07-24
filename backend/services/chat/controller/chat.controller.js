import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

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
 * POST /message
 * Save a new message to a conversation. Validates ownership.
 */
export const saveMessage = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { conversationId, role, content } = req.body;

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

    // Create the message
    const message = await Message.create({
      conversationId,
      role,
      content,
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
      .select("-__v");

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("getMessagesByConversation error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};
