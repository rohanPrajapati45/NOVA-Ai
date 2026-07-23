import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true, // Frequent query: "all messages in a conversation"
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Future fields (not added yet — will be added when agents are wired in):
    // - agentType: String (e.g. "image", "pdf", "ppt") — which agent generated this
    // - attachments: [{ url: String, type: String }] — uploaded/generated files
  },
  {
    timestamps: true, // Adds createdAt automatically
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
