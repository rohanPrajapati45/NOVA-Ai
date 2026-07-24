import React from "react";
import { FileCode2 } from "lucide-react";

/**
 * Artifacts — Skeleton only for this phase.
 * Empty bordered panel with placeholder label.
 * Real artifact rendering (code blocks, files, etc.) comes later.
 */
const Artifacts = () => {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: "320px",
        minWidth: "320px",
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-4"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          minHeight: "56px",
        }}
      >
        <FileCode2
          size={16}
          style={{ color: "var(--accent)", flexShrink: 0 }}
        />
        <span
          className="font-medium text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Artifacts
        </span>
      </div>

      {/* Empty state placeholder */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: "var(--text-muted)" }}
      >
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div
            className="rounded-xl flex items-center justify-center"
            style={{
              width: "44px",
              height: "44px",
              background: "var(--bg-elevated)",
            }}
          >
            <FileCode2 size={20} strokeWidth={1.3} style={{ color: "var(--text-muted)" }} />
          </div>
          <p
            className="text-xs text-center"
            style={{ maxWidth: "160px", lineHeight: "1.5", color: "var(--text-muted)" }}
          >
            Artifacts will appear here when agents generate code, files, or other outputs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Artifacts;
