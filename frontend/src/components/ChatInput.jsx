import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Send,
  Paperclip,
  Mic,
  Sparkles,
  MessageCircle,
  Globe,
  Code2,
  FileText,
  Presentation,
  ImageIcon,
} from "lucide-react";
import { addMessage, setSending, setActiveArtifact } from "../redux/messageSlice";
import {
  addConversation,
  setActiveConversation,
  updateConvoTitleInStore,
} from "../redux/conversationSlice";
import { sendMessage } from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import { updateConversationTitle } from "../features/updateConversation";

/**
 * Agent selector pill definitions.
 * 'auto' maps to null in the payload (router LLM decides).
 * All others map to their string value.
 */
const AGENT_OPTIONS = [
  { key: "auto", label: "Auto", icon: Sparkles },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "search", label: "Search", icon: Globe },
  { key: "coding", label: "Coding", icon: Code2 },
  { key: "pdf", label: "PDF", icon: FileText },
  { key: "ppt", label: "PPT", icon: Presentation },
  { key: "image", label: "Image", icon: ImageIcon },
];

/**
 * Generate a clean conversation title from the user's first message.
 * Collapses spaces, trims, and truncates to a maximum of 40 characters,
 * cutting at a word boundary if possible.
 */
const generateTitle = (text) => {
  const cleanText = text.trim().replace(/\s+/g, " ");
  if (cleanText.length <= 40) return cleanText;

  const sliced = cleanText.slice(0, 40);
  const lastSpaceIndex = sliced.lastIndexOf(" ");

  if (lastSpaceIndex > 0) {
    return sliced.slice(0, lastSpaceIndex) + "…";
  }
  return sliced + "…";
};

/**
 * Chat input with agent selector pills, textarea, and send button.
 *
 * On send:
 * 1. If no activeConversation → auto-create one first
 * 2. Optimistic UI: immediately add user message to Redux + clear input
 * 3. Call agent service with selected agent override → add assistant response
 * 4. On failure → add error message as assistant response
 *
 * DESIGN DECISION: selectedAgentMode resets to 'auto' after every send.
 * Manual agent selection is treated as a one-off override, not a sticky preference.
 * This matches the typical usage pattern where users occasionally want to
 * force a specific agent but normally want auto-routing.
 */
const ChatInput = ({ draftMessage, setDraftMessage }) => {
  const dispatch = useDispatch();
  const { activeConversationId, conversations } = useSelector(
    (state) => state.conversation
  );
  const { sending } = useSelector((state) => state.message);

  // Transient UI state — resets to 'auto' after each send
  const [selectedAgentMode, setSelectedAgentMode] = useState("auto");

  const canSend = draftMessage.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;

    const messageText = draftMessage.trim();
    let conversationId = activeConversationId;
    let isNewConvo = false;

    // Auto-create conversation if user types directly without "New Chat"
    if (!conversationId) {
      try {
        const newConvo = await createConversation();
        dispatch(addConversation(newConvo));
        dispatch(setActiveConversation(newConvo._id));
        // Use local variable directly — Redux state update is async
        conversationId = newConvo._id;
        isNewConvo = true;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    // Check if title update is needed (only when title is still default)
    // Edge case: if user literally types "New Conversation" as their first message,
    // this will still trigger a title update (to the same string) — acceptable.
    const currentConvo = conversations.find((c) => c._id === conversationId);
    const isDefaultTitle =
      isNewConvo ||
      (currentConvo ? currentConvo.title === "New Conversation" : true);

    // Capture the agent override before resetting
    const agentOverride =
      selectedAgentMode === "auto" ? null : selectedAgentMode;

    // Reset to auto after send (one-off override behavior)
    setSelectedAgentMode("auto");

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
        agentOverride,
      });

      dispatch(
        addMessage({
          role: "assistant",
          content: result.response,
          createdAt: new Date().toISOString(),
          // Include search images for immediate rendering (optimistic)
          searchImages: result.searchImages || [],
          // Include artifacts
          artifactTitle: result.artifactTitle || null,
          artifactFiles: result.artifactFiles || [],
        })
      );

      // Auto-open Artifact panel if a new code artifact was generated
      if (result.artifactFiles && Array.isArray(result.artifactFiles) && result.artifactFiles.length > 0) {
        dispatch(
          setActiveArtifact({
            title: result.artifactTitle || "Code Artifact",
            files: result.artifactFiles,
          })
        );
      }

      // Trigger title update if needed
      if (isDefaultTitle) {
        const generatedTitle = generateTitle(messageText);
        updateConversationTitle({ conversationId, title: generatedTitle })
          .then(() => {
            dispatch(
              updateConvoTitleInStore({ conversationId, title: generatedTitle })
            );
          })
          .catch((err) => {
            console.error("Failed to update conversation title:", err);
          });
      }
    } catch (err) {
      console.error("Agent service error:", err);
      dispatch(
        addMessage({
          role: "assistant",
          content: "Something went wrong. Please try again.",
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
        {/* ─── Agent Selector Pills ──────────────────────────────── */}
        <div
          className="flex gap-1.5 mb-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {AGENT_OPTIONS.map((agent) => {
            const isActive = selectedAgentMode === agent.key;
            return (
              <button
                key={agent.key}
                onClick={() => setSelectedAgentMode(agent.key)}
                className="flex items-center gap-1.5 rounded-full cursor-pointer flex-shrink-0"
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#FFFFFF" : "var(--text-muted)",
                  border: isActive
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border-subtle)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }
                }}
              >
                <agent.icon size={13} />
                <span>{agent.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Input Area ────────────────────────────────────────── */}
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
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onFocus={(e) => {
              e.target.closest("[style]").style.borderColor = "var(--accent)";
              e.target.closest("[style]").style.boxShadow =
                "0 0 0 3px var(--accent-muted)";
            }}
            onBlur={(e) => {
              e.target.closest("[style]").style.borderColor =
                "var(--border-subtle)";
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
              transition:
                "background 0.2s, transform 0.1s, opacity 0.2s",
              opacity: canSend ? 1 : 0.4,
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              if (canSend)
                e.currentTarget.style.background = "var(--accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (canSend)
                e.currentTarget.style.background = "var(--accent)";
            }}
            onMouseDown={(e) => {
              if (canSend)
                e.currentTarget.style.transform = "scale(0.93)";
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
