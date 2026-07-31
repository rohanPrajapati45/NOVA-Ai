import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  Code2,
  FileCode2,
  PanelRightClose,
  Copy,
  Check,
  Play,
  FileText,
  FileJson,
  Terminal,
} from "lucide-react";
import {
  closeArtifactPanel,
  toggleArtifactPanel,
} from "../redux/messageSlice";

// Map common output languages to Monaco-supported language identifiers
const LANGUAGE_MAP = {
  html: "html",
  css: "css",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  py: "python",
  json: "json",
  markdown: "markdown",
  md: "markdown",
  cpp: "cpp",
  c: "c",
  java: "java",
  rust: "rust",
  rs: "rust",
  go: "go",
  sql: "sql",
  shell: "shell",
  sh: "shell",
  bash: "shell",
};

// Map languages to file icons
const getFileIcon = (lang) => {
  const l = (lang || "").toLowerCase();
  if (l === "html") return <FileCode2 size={14} className="text-orange-500" />;
  if (l === "css") return <FileCode2 size={14} className="text-blue-400" />;
  if (l === "javascript" || l === "js") return <FileCode2 size={14} className="text-yellow-400" />;
  if (l === "python" || l === "py") return <Terminal size={14} className="text-green-400" />;
  if (l === "json") return <FileJson size={14} className="text-purple-400" />;
  return <FileText size={14} className="text-gray-400" />;
};

/**
 * Normalizes code content strings: handles literal \n / \t escapes if unescaped
 * from JSON responses, ensuring clean multi-line code display.
 */
const formatCodeContent = (content) => {
  if (!content || typeof content !== "string") return "";
  return content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "  ");
};

const Artifacts = () => {
  const dispatch = useDispatch();
  const { activeArtifact, isArtifactPanelOpen } = useSelector(
    (state) => state.message
  );

  const [viewMode, setViewMode] = useState("code"); // 'code' | 'preview'
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // If no active artifact exists, render nothing
  if (!activeArtifact) return null;

  // Reset active file index and view mode when artifact changes
  useEffect(() => {
    setActiveFileIndex(0);
    setViewMode("code");
  }, [activeArtifact]);

  const hasHtml = activeArtifact.files?.some(
    (f) =>
      (f.language || "").toLowerCase() === "html" ||
      (f.filename || "").endsWith(".html")
  );

  const currentFile = activeArtifact.files?.[activeFileIndex] || null;

  const handleCopy = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  /**
   * CONSTRUCT RUNNABLE HTML DOCUMENT (srcDoc)
   *
   * To preview the generated application in an iframe:
   * 1. We locate the primary HTML file in the files array.
   * 2. We extract the content of any accompanying CSS and JS files.
   * 3. We construct a single unified HTML string by:
   *    - Inlining style.css inside a <style> block in the <head>
   *    - Inlining script.js inside a <script> block before the closing </body> tag
   *    - Stripping/updating external relative references to styled files
   *      so they do not fail to load from relative domains.
   */
  const buildSrcDoc = () => {
    const htmlFile = activeArtifact.files.find(
      (f) =>
        (f.language || "").toLowerCase() === "html" ||
        (f.filename || "").endsWith(".html")
    );
    if (!htmlFile) return "";

    let docContent = htmlFile.content;

    // Find style files
    const cssFiles = activeArtifact.files.filter(
      (f) =>
        (f.language || "").toLowerCase() === "css" ||
        (f.filename || "").endsWith(".css")
    );
    // Find script files
    const jsFiles = activeArtifact.files.filter(
      (f) =>
        (f.language || "").toLowerCase() === "javascript" ||
        (f.language || "").toLowerCase() === "js" ||
        (f.filename || "").endsWith(".js")
    );

    // Inline CSS styles
    if (cssFiles.length > 0) {
      const stylesInline = cssFiles
        .map((f) => `/* Inlined from ${f.filename} */\n${f.content}`)
        .join("\n\n");
      const styleBlock = `<style>\n${stylesInline}\n</style>`;

      if (docContent.includes("</head>")) {
        docContent = docContent.replace("</head>", `${styleBlock}\n</head>`);
      } else {
        docContent = `${styleBlock}\n${docContent}`;
      }
    }

    // Inline JS scripts
    if (jsFiles.length > 0) {
      const scriptsInline = jsFiles
        .map((f) => `// Inlined from ${f.filename}\n${f.content}`)
        .join("\n\n");
      const scriptBlock = `<script>\n${scriptsInline}\n</script>`;

      if (docContent.includes("</body>")) {
        docContent = docContent.replace("</body>", `${scriptBlock}\n</body>`);
      } else {
        docContent = `${docContent}\n${scriptBlock}`;
      }
    }

    return docContent;
  };

  return (
    <AnimatePresence initial={false}>
      {!isArtifactPanelOpen ? (
        // ─── COLLAPSED TAB VIEW ──────────────────────────────────────
        <motion.div
          key="collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 40, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={() => dispatch(toggleArtifactPanel())}
          className="flex flex-col items-center justify-between py-6 cursor-pointer border-l hover:bg-opacity-80 transition-colors select-none"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
            height: "100%",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <Code2 size={18} style={{ color: "var(--accent)" }} />
          </div>

          {/* Rotated vertical text title */}
          <div
            className="flex-1 flex items-center justify-center font-medium text-xs tracking-wider"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {activeArtifact.title}
          </div>

          <div
            className="w-5 h-5 rounded-full flex items-center justify-center border"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <Play size={10} style={{ color: "var(--text-muted)" }} />
          </div>
        </motion.div>
      ) : (
        // ─── FULL PANEL VIEW ─────────────────────────────────────────
        <motion.div
          key="expanded"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 500, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col h-full border-l overflow-hidden shadow-2xl relative"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* Header */}
          <div
            className="flex flex-col px-5 pt-4 pb-3 gap-3"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Code2
                  size={16}
                  style={{ color: "var(--accent)", flexShrink: 0 }}
                />
                <span
                  className="font-semibold text-sm truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeArtifact.title}
                </span>
              </div>
              <button
                onClick={() => dispatch(closeArtifactPanel())}
                className="p-1.5 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
                style={{ color: "var(--text-muted)" }}
                title="Collapse Panel"
              >
                <PanelRightClose size={16} />
              </button>
            </div>

            {/* View Mode Toggle Controls (Segmented Control) */}
            {hasHtml && (
              <div
                className="flex p-0.5 rounded-lg w-fit"
                style={{ background: "var(--bg-elevated)" }}
              >
                <button
                  onClick={() => setViewMode("code")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === "code"
                      ? "shadow-sm"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background: viewMode === "code" ? "var(--accent)" : "transparent",
                    color: viewMode === "code" ? "#ffffff" : "var(--text-secondary)",
                  }}
                >
                  <Code2 size={13} />
                  Code
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === "preview"
                      ? "shadow-sm"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    background: viewMode === "preview" ? "var(--accent)" : "transparent",
                    color: viewMode === "preview" ? "#ffffff" : "var(--text-secondary)",
                  }}
                >
                  <Play size={13} />
                  Preview
                </button>
              </div>
            )}
          </div>

          {/* Body Content based on View Mode */}
          {viewMode === "code" ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* File Tabs Row */}
              {activeArtifact.files?.length > 1 && (
                <div
                  className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto custom-scrollbar"
                  style={{
                    background: "var(--bg-base)",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {activeArtifact.files.map((file, index) => {
                    const isActive = index === activeFileIndex;
                    return (
                      <button
                        key={file.filename}
                        onClick={() => setActiveFileIndex(index)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap ${
                          isActive
                            ? "font-medium"
                            : "opacity-60 hover:opacity-100 hover:bg-opacity-5 hover:bg-white"
                        }`}
                        style={{
                          background: isActive ? "var(--bg-elevated)" : "transparent",
                          color: isActive ? "var(--accent)" : "var(--text-secondary)",
                          border: isActive ? "1px solid var(--border-subtle)" : "1px solid transparent",
                        }}
                      >
                        {getFileIcon(file.language)}
                        {file.filename}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Monaco Editor Container */}
              <div className="flex-1 relative min-h-0">
                {currentFile ? (
                  <>
                    <Editor
                      height="100%"
                      language={
                        LANGUAGE_MAP[currentFile.language?.toLowerCase()] ||
                        "plaintext"
                      }
                      value={formatCodeContent(currentFile.content)}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                        lineHeight: 20,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        folding: true,
                        renderLineHighlight: "all",
                        lineNumbersMinChars: 3,
                        padding: { top: 14, bottom: 14 },
                        bracketPairColorization: { enabled: true },
                        guides: { indentation: true, bracketPairs: true },
                      }}
                    />
                    {/* Floating Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-1.5 rounded-lg border shadow-md transition-all flex items-center justify-center"
                      style={{
                        background: "var(--bg-surface)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                      title="Copy Code"
                    >
                      {copied ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </>
                ) : (
                  <div
                    className="flex items-center justify-center h-full text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No file content available
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ─── PREVIEW VIEW ────────────────────────────────────────
            <div className="flex-1 w-full h-full min-h-0 bg-white relative">
              <iframe
                title="live-preview"
                srcDoc={buildSrcDoc()}
                sandbox="allow-scripts"
                className="w-full h-full border-none"
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Artifacts;
