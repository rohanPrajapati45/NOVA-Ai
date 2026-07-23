import { Router } from "express";
import {
  createConversation,
  updateConversation,
  saveMessage,
  getMessagesByConversation,
} from "../controller/chat.controller.js";

const router = Router();

// POST /conversation — create a new conversation
router.post("/conversation", createConversation);

// PATCH /conversation/:conversationId — update conversation (e.g. title)
router.patch("/conversation/:conversationId", updateConversation);

// POST /message — save a message to a conversation
router.post("/message", saveMessage);

// GET /message/:conversationId — get all messages for a conversation
router.get("/message/:conversationId", getMessagesByConversation);

export default router;
