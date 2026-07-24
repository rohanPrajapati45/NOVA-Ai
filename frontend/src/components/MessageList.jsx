import React, { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Sparkles, Code2, Search, FileText, Presentation } from "lucide-react";
import MessageBubble from "./MessageBubble";

/**
 * Example prompt cards for the empty state.
 * Clicking a card prefills the input (not auto-send) — this prevents
 * accidental sends of example prompts and lets users review/edit first.
 */
const EXAMPLE_PROMPTS = [
  {
    icon: Code2,
    label: "Coding",
    prompt: "Write a Python function to reverse a linked list",
    color: "var(--accent)",
  },
  {
    icon: Search,
    label: "Search",
    prompt: "What's the latest news in AI this week?",
    color: "#2ED573",
  },
  {
    icon: FileText,
    label: "Document",
    prompt: "Summarize the key points of this document",
    color: "#FFA502",
  },
  {
    icon: Presentation,
    label: "Presentation",
    prompt: "Create an outline for a presentation on climate change",
    color: "#FF6B81",
  },
];

const MessageList = ({ activeConversationId, setDraftMessage }) => {
  const { messages, loading, sending } = useSelector((state) => state.message);
  const bottomRef = useRef(null);

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, sending]);

  // ─── Empty state: no conversation or no messages ──────────────────
  if (!activeConversationId || (messages.length === 0 && !loading)) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto custom-scrollbar p-6">
        <div className="flex flex-col items-center gap-6 animate-fade-in max-w-lg w-full">
          {/* Branding */}
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{
              width: "56px",
              height: "56px",
              background: "var(--accent-muted)",
            }}
          >
            <Sparkles size={26} style={{ color: "var(--accent)" }} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h2
              className="font-semibold text-lg mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              How can I help you today?
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Choose a prompt below or type your own message
            </p>
          </div>

          {/* Example prompt cards — 2x2 grid on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setDraftMessage(ex.prompt)}
                className="flex items-start gap-3 text-left rounded-xl cursor-pointer w-full"
                style={{
                  padding: "14px 16px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  transition: "border-color 0.2s, background 0.2s, transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                  e.currentTarget.style.background = "var(--bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.background = "var(--bg-surface)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <ex.icon
                  size={16}
                  style={{ color: ex.color, flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <p
                    className="font-medium text-xs mb-1"
                    style={{ color: "var(--text-muted)", margin: 0 }}
                  >
                    {ex.label}
                  </p>
                  <p
                    className="text-sm"
                    style={{
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {ex.prompt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: "8px",
                  height: "8px",
                  background: "var(--accent)",
                  animation: `thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  // ─── Messages ─────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 py-4" style={{ minHeight: 0 }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {messages.map((msg, i) => (
          <MessageBubble key={msg._id || `msg-${i}`} message={msg} />
        ))}

        {/* Thinking indicator while waiting for agent response */}
        {sending && (
          <div className="flex gap-3 justify-start" style={{ padding: "4px 0" }}>
            <div
              className="rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                width: "30px",
                height: "30px",
                background: "var(--accent-muted)",
                marginTop: "2px",
              }}
            >
              <Sparkles size={14} style={{ color: "var(--accent)" }} />
            </div>
            <div
              className="rounded-2xl flex items-center gap-1.5"
              style={{
                padding: "14px 20px",
                background: "var(--bg-elevated)",
                borderBottomLeftRadius: "6px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    background: "var(--text-muted)",
                    animation: `thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
