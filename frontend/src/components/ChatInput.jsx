import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Send, Paperclip, Mic } from "lucide-react";
import { addMessage, setSending } from "../redux/messageSlice";
import {
  addConversation,
  setActiveConversation,
} from "../redux/conversationSlice";
import { sendMessage } from "../features/sendMessage";
import { createConversation } from "../features/createConversation";

/**
 * Chat input with textarea, placeholder icons (attachment/voice), and send button.
 *
 * On send:
 * 1. If no activeConversation → auto-create one first
 * 2. Optimistic UI: immediately add user message to Redux + clear input
 * 3. Call agent service → add assistant response on success
 * 4. On failure → add error message as assistant response
 *
 * Trade-off: We do NOT re-fetch messages from the server after each send.
 * The backend already persists both messages, and optimistic local update
 * gives instant UI feedback. Perfect sync is verified on page refresh
 * (getMessages re-fetches from MongoDB). This avoids an extra network
 * round trip after every message.
 */
const ChatInput = ({ draftMessage, setDraftMessage }) => {
  const dispatch = useDispatch();
  const { activeConversationId } = useSelector((state) => state.conversation);
  const { sending } = useSelector((state) => state.message);

  const canSend = draftMessage.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;

    const messageText = draftMessage.trim();
    let conversationId = activeConversationId;

    // Auto-create conversation if user types directly without "New Chat"
    if (!conversationId) {
      try {
        const newConvo = await createConversation();
        dispatch(addConversation(newConvo));
        dispatch(setActiveConversation(newConvo._id));
        conversationId = newConvo._id;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    // Optimistic UI: show user message immediately
    dispatch(
      addMessage({
        role: "user",
        content: messageText,
        createdAt: new Date().toISOString(),
      })
    );

    // Clear input immediately
    setDraftMessage("");

    // Call agent service
    dispatch(setSending(true));
    try {
      const result = await sendMessage({
        conversationId,
        userPrompt: messageText,
      });
      dispatch(
        addMessage({
          role: "assistant",
          content: result.response,
          createdAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error("Agent service error:", err);
      dispatch(
        addMessage({
          role: "assistant",
          content:
            "Something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        })
      );
    } finally {
      dispatch(setSending(false));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="px-4 md:px-6 py-3"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="flex items-end gap-2 rounded-2xl"
          style={{
            padding: "8px 8px 8px 14px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          {/* Attachment placeholder */}
          <button
            className="flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
            style={{
              width: "32px",
              height: "32px",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              transition: "color 0.2s",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
            }}
            title="Attach files — Coming soon"
            onClick={() => {}}
          >
            <Paperclip size={16} />
          </button>

          {/* Textarea */}
          <textarea
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none custom-scrollbar"
            style={{
              color: "var(--text-primary)",
              border: "none",
              fontSize: "13.5px",
              lineHeight: "1.5",
              maxHeight: "120px",
              minHeight: "24px",
              padding: "4px 0",
            }}
            onInput={(e) => {
              // Auto-resize textarea to fit content (up to maxHeight)
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onFocus={(e) => {
              e.target.closest("[style]").style.borderColor = "var(--accent)";
              e.target.closest("[style]").style.boxShadow = "0 0 0 3px var(--accent-muted)";
            }}
            onBlur={(e) => {
              e.target.closest("[style]").style.borderColor = "var(--border-subtle)";
              e.target.closest("[style]").style.boxShadow = "none";
            }}
          />

          {/* Mic placeholder */}
          <button
            className="flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
            style={{
              width: "32px",
              height: "32px",
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              transition: "color 0.2s",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
            }}
            title="Voice input — Coming soon"
            onClick={() => {}}
          >
            <Mic size={16} />
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center justify-center rounded-xl cursor-pointer flex-shrink-0"
            style={{
              width: "36px",
              height: "36px",
              background: canSend ? "var(--accent)" : "var(--bg-hover)",
              color: canSend ? "#FFFFFF" : "var(--text-muted)",
              border: "none",
              transition: "background 0.2s, transform 0.1s, opacity 0.2s",
              opacity: canSend ? 1 : 0.4,
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              if (canSend) e.currentTarget.style.background = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (canSend) e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseDown={(e) => {
              if (canSend) e.currentTarget.style.transform = "scale(0.93)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Send message"
          >
            <Send size={16} />
          </button>
        </div>

        <p
          className="text-center mt-2"
          style={{ fontSize: "10px", color: "var(--text-faint)" }}
        >
          Nova may produce inaccurate information. Verify important facts.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
