import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Bot, User, Copy, Check, ImageOff, X, FileText, Download, Presentation } from "lucide-react";

/**
 * CopyButton — overlays top-right of code blocks.
 * Shows Copy icon, swaps to Check for 2 seconds on success.
 */
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md cursor-pointer"
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        padding: "4px 8px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: copied ? "var(--success)" : "var(--text-muted)",
        fontSize: "11px",
        transition: "color 0.2s, background 0.2s",
        zIndex: 2,
      }}
      onMouseEnter={(e) => {
        if (!copied) e.currentTarget.style.background = "rgba(255,255,255,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
  );
};

/**
 * ImageLightbox — minimal fullscreen overlay for viewing search images.
 * Click outside or X button to close.
 */
const ImageLightbox = ({ src, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      cursor: "pointer",
    }}
  >
    <button
      onClick={onClose}
      style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        background: "rgba(255,255,255,0.1)",
        border: "none",
        borderRadius: "50%",
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      <X size={20} />
    </button>
    <img
      src={src}
      alt="Search result"
      onClick={(e) => e.stopPropagation()}
      style={{
        maxWidth: "90vw",
        maxHeight: "90vh",
        borderRadius: "8px",
        objectFit: "contain",
        cursor: "default",
      }}
    />
  </div>
);

/**
 * SearchImageStrip — horizontally scrollable row of search result images.
 * Only rendered when searchImages.length > 0.
 */
const SearchImageStrip = ({ images }) => {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [failedUrls, setFailedUrls] = useState(new Set());

  const visibleImages = images.filter((img) => !failedUrls.has(img.url));

  if (visibleImages.length === 0) return null;

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
      <div
        className="flex gap-2 overflow-x-auto mt-3 pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {visibleImages.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt={img.description || "Search result image"}
            loading="lazy"
            onClick={() => setLightboxSrc(img.url)}
            onError={() => {
              setFailedUrls((prev) => new Set(prev).add(img.url));
            }}
            className="flex-shrink-0 cursor-pointer"
            style={{
              height: "120px",
              width: "auto",
              minWidth: "120px",
              maxWidth: "200px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              transition: "transform 0.15s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = "var(--border-subtle)";
            }}
          />
        ))}
      </div>
    </>
  );
};

/**
 * Custom react-markdown component overrides for rich assistant message rendering.
 */
const markdownComponents = {
  // ─── Code blocks + inline code ─────────────────────────────────
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");

    // Fenced code block with language → syntax highlighted
    if (!inline && match) {
      const codeString = String(children).replace(/\n$/, "");
      return (
        <div style={{ position: "relative", margin: "12px 0" }}>
          {/* Language badge */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "12px",
              fontSize: "10px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              zIndex: 2,
            }}
          >
            {match[1]}
          </div>
          <CopyButton text={codeString} />
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{
              background: "#1A1A24",
              borderRadius: "10px",
              padding: "32px 16px 16px",
              fontSize: "13px",
              lineHeight: "1.6",
              border: "1px solid var(--border-subtle)",
              margin: 0,
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }

    // Fenced code block WITHOUT language → plain block, still gets copy button
    if (!inline) {
      const codeString = String(children).replace(/\n$/, "");
      return (
        <div style={{ position: "relative", margin: "12px 0" }}>
          <CopyButton text={codeString} />
          <pre
            style={{
              background: "#1A1A24",
              borderRadius: "10px",
              padding: "32px 16px 16px",
              fontSize: "13px",
              lineHeight: "1.6",
              border: "1px solid var(--border-subtle)",
              margin: 0,
              overflowX: "auto",
              color: "var(--text-primary)",
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            }}
          >
            <code>{codeString}</code>
          </pre>
        </div>
      );
    }

    // Inline code (single backticks)
    return (
      <code
        style={{
          background: "rgba(108, 92, 231, 0.15)",
          color: "var(--accent-hover)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.9em",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        }}
        {...props}
      >
        {children}
      </code>
    );
  },

  // ─── Links ─────────────────────────────────────────────────────
  a({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "var(--accent)",
          textDecoration: "none",
          transition: "text-decoration 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
        {...props}
      >
        {children}
      </a>
    );
  },

  // ─── Headers ───────────────────────────────────────────────────
  h1({ children, ...props }) {
    return (
      <h1
        style={{
          fontSize: "1.5em",
          fontWeight: 700,
          margin: "20px 0 10px",
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2({ children, ...props }) {
    return (
      <h2
        style={{
          fontSize: "1.25em",
          fontWeight: 600,
          margin: "18px 0 8px",
          color: "var(--text-primary)",
          lineHeight: 1.35,
        }}
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    return (
      <h3
        style={{
          fontSize: "1.1em",
          fontWeight: 600,
          margin: "14px 0 6px",
          color: "var(--text-primary)",
          lineHeight: 1.4,
        }}
        {...props}
      >
        {children}
      </h3>
    );
  },

  // ─── Tables ────────────────────────────────────────────────────
  table({ children, ...props }) {
    return (
      <div style={{ overflowX: "auto", margin: "12px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }) {
    return (
      <thead
        style={{
          background: "var(--bg-elevated)",
          fontWeight: 600,
        }}
        {...props}
      >
        {children}
      </thead>
    );
  },
  th({ children, ...props }) {
    return (
      <th
        style={{
          padding: "8px 12px",
          textAlign: "left",
          borderBottom: "2px solid var(--border-hover)",
          color: "var(--text-primary)",
        }}
        {...props}
      >
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
        {...props}
      >
        {children}
      </td>
    );
  },

  // ─── Lists ─────────────────────────────────────────────────────
  ul({ children, ...props }) {
    return (
      <ul
        style={{
          paddingLeft: "20px",
          margin: "8px 0",
          listStyleType: "disc",
        }}
        {...props}
      >
        {children}
      </ul>
    );
  },
  ol({ children, ...props }) {
    return (
      <ol
        style={{
          paddingLeft: "20px",
          margin: "8px 0",
          listStyleType: "decimal",
        }}
        {...props}
      >
        {children}
      </ol>
    );
  },
  li({ children, ...props }) {
    return (
      <li
        style={{
          margin: "4px 0",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
        }}
        {...props}
      >
        {children}
      </li>
    );
  },

  // ─── Blockquote ────────────────────────────────────────────────
  blockquote({ children, ...props }) {
    return (
      <blockquote
        style={{
          borderLeft: "3px solid var(--accent)",
          paddingLeft: "14px",
          margin: "12px 0",
          color: "var(--text-muted)",
          fontStyle: "italic",
        }}
        {...props}
      >
        {children}
      </blockquote>
    );
  },

  // ─── Paragraph ─────────────────────────────────────────────────
  p({ children, ...props }) {
    return (
      <p
        style={{
          margin: "6px 0",
          lineHeight: 1.7,
          color: "var(--text-primary)",
        }}
        {...props}
      >
        {children}
      </p>
    );
  },

  // ─── Horizontal rule ──────────────────────────────────────────
  hr(props) {
    return (
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--border-subtle)",
          margin: "16px 0",
        }}
        {...props}
      />
    );
  },

  // ─── Strong / emphasis ─────────────────────────────────────────
  strong({ children, ...props }) {
    return (
      <strong style={{ fontWeight: 600, color: "var(--text-primary)" }} {...props}>
        {children}
      </strong>
    );
  },
  em({ children, ...props }) {
    return (
      <em style={{ fontStyle: "italic" }} {...props}>
        {children}
      </em>
    );
  },
};

/**
 * FileDownloadCard — reusable download card for AI-generated files (PDF, PPT, etc.).
 * Parameterized with icon, colors, and file type label so new file agents
 * can reuse the same component without building separate UI.
 * Uses fetch → blob → anchor-click download for cross-origin presigned URLs.
 */
const FileDownloadCard = ({ url, title, filename, typeLabel, IconComponent, iconColor, iconBgColor }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn(`${typeLabel} blob download failed, opening in new tab:`, err);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "12px",
        padding: "12px 16px",
        background: "rgba(255,255,255,0.03)",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: "420px",
        transition: "border-color 0.2s",
        cursor: "pointer",
      }}
      onClick={handleDownload}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      {/* File type icon */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: iconBgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconComponent size={20} style={{ color: iconColor }} />
      </div>

      {/* Title + type label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "2px",
          }}
        >
          {typeLabel} • Click to download
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        style={{
          padding: "6px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          background: "var(--accent-muted)",
          color: "var(--accent)",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <Download size={14} />
        <span>{downloading ? "Saving…" : "Download"}</span>
      </button>
    </div>
  );
};

/**
 * Single message renderer with asymmetric styling:
 * - USER messages: right-aligned bubble with accent background (unchanged)
 * - ASSISTANT messages: left-aligned, NO bubble background (professional look,
 *   mirrors ChatGPT/Claude style), full-width text with rich markdown rendering
 */
const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";
  const searchImages = message.searchImages || [];
  const generatedPdfUrl = message.generatedPdfUrl || null;
  const pdfTitle = message.pdfTitle || null;
  const generatedPptUrl = message.generatedPptUrl || null;
  const pptTitle = message.pptTitle || null;
  const generatedImageUrl = message.generatedImageUrl || null;

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

      {/* Content */}
      {isUser ? (
        /* USER BUBBLE */
        <div
          className="rounded-2xl"
          style={{
            maxWidth: "75%",
            padding: "10px 16px",
            background: "var(--accent)",
            color: "#FFFFFF",
            fontSize: "13.5px",
            lineHeight: "1.65",
            borderBottomRightRadius: "6px",
            wordBreak: "break-word",
          }}
        >
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
        </div>
      ) : (
        /* ASSISTANT — no bubble background, professional flat rendering */
        <div
          style={{
            maxWidth: "85%",
            fontSize: "13.5px",
            lineHeight: "1.65",
            wordBreak: "break-word",
          }}
        >
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* AI-generated PDF download card */}
          {generatedPdfUrl && (
            <FileDownloadCard
              url={generatedPdfUrl}
              title={pdfTitle || "Report"}
              filename={`${pdfTitle || "report"}.pdf`}
              typeLabel="PDF Document"
              IconComponent={FileText}
              iconColor="#DC2626"
              iconBgColor="rgba(220, 38, 38, 0.12)"
            />
          )}

          {/* AI-generated PPT download card */}
          {generatedPptUrl && (
            <FileDownloadCard
              url={generatedPptUrl}
              title={pptTitle || "Presentation"}
              filename={`${pptTitle || "presentation"}.pptx`}
              typeLabel="PowerPoint Presentation"
              IconComponent={Presentation}
              iconColor="#D97706"
              iconBgColor="rgba(217, 119, 6, 0.12)"
            />
          )}

          {/* Search result images */}
          {searchImages.length > 0 && (
            <SearchImageStrip images={searchImages} />
          )}
        </div>
      )}

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
