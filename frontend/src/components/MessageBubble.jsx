import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";

/**
 * Single message renderer. User messages align right with accent background,
 * assistant messages align left with neutral dark background and markdown rendering.
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      style={{ padding: "4px 0" }}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div
          className="rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            width: "30px",
            height: "30px",
            background: "var(--accent-muted)",
            marginTop: "2px",
          }}
        >
          <Bot size={16} style={{ color: "var(--accent)" }} />
        </div>
      )}

      {/* Bubble */}
      <div
        className="rounded-2xl"
        style={{
          maxWidth: "75%",
          padding: "10px 16px",
          background: isUser ? "var(--accent)" : "var(--bg-elevated)",
          color: isUser ? "#FFFFFF" : "var(--text-primary)",
          fontSize: "13.5px",
          lineHeight: "1.65",
          borderBottomRightRadius: isUser ? "6px" : "16px",
          borderBottomLeftRadius: isUser ? "16px" : "6px",
          wordBreak: "break-word",
        }}
      >
        {isUser ? (
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            width: "30px",
            height: "30px",
            background: "var(--accent)",
            marginTop: "2px",
          }}
        >
          <User size={16} style={{ color: "#FFFFFF" }} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
