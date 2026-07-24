import React from "react";
import { useSelector } from "react-redux";
import { PanelRight, PanelRightClose } from "lucide-react";

/**
 * Top navigation bar for the chat area.
 * Shows current conversation title + artifacts panel toggle.
 */
const Nav = ({ isArtifactsOpen, onToggleArtifacts }) => {
  const { conversations, activeConversationId } = useSelector(
    (state) => state.conversation
  );

  // Find the active conversation's title
  const activeConvo = conversations.find((c) => c._id === activeConversationId);
  const title = activeConvo?.title || "New Chat";

  return (
    <div
      className="flex items-center justify-between px-5"
      style={{
        minHeight: "52px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-base)",
      }}
    >
      {/* Conversation title */}
      <h2
        className="font-medium truncate"
        style={{
          fontSize: "14px",
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        {title}
      </h2>

      {/* Artifacts toggle — hidden on mobile (<768px) via CSS */}
      <button
        onClick={onToggleArtifacts}
        className="hidden md:flex items-center justify-center rounded-lg cursor-pointer"
        style={{
          width: "32px",
          height: "32px",
          background: isArtifactsOpen ? "var(--accent-muted)" : "transparent",
          color: isArtifactsOpen ? "var(--accent)" : "var(--text-muted)",
          border: "none",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isArtifactsOpen) {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isArtifactsOpen) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-muted)";
          }
        }}
        title={isArtifactsOpen ? "Close artifacts" : "Open artifacts"}
      >
        {isArtifactsOpen ? (
          <PanelRightClose size={17} />
        ) : (
          <PanelRight size={17} />
        )}
      </button>
    </div>
  );
};

export default Nav;
