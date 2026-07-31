import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  PanelLeft,
  PanelLeftClose,
  SquarePen,
  MessageSquare,
  CreditCard,
  Coins,
  LogOut,
  MessagesSquare,
} from "lucide-react";
import { clearUser } from "../redux/userSlice";
import {
  setConversations,
  addConversation,
  setActiveConversation,
  resetConversations,
} from "../redux/conversationSlice";
import { getConversations } from "../features/getConversations";
import { createConversation } from "../features/createConversation";
import { logout } from "../features/logout";

/**
 * Generate a stable HSL color from a string (name/email).
 * Uses a simple hash so the same user always gets the same color.
 */
const getAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
};

/** Extract up to 2 initials from a name */
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Format a date for sidebar display */
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const Sidebar = ({ onOpenBilling }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { conversations, activeConversationId, loading } = useSelector(
    (state) => state.conversation
  );

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [imgError, setImgError] = useState(false);

  const userPlan = (user?.plan || "FREE").toUpperCase();
  const userCredits = typeof user?.credits === "number" ? user.credits : 100;

  // ─── Fetch conversations on mount ───────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        if (data) {
          dispatch(setConversations(data));
        } else {
          dispatch(setConversations([]));
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        dispatch(setConversations([]));
      }
    };
    fetchConversations();
  }, [dispatch, user]);

  // ─── Create new conversation ────────────────────────────────────
  const handleNewChat = async () => {
    if (creatingChat) return;
    setCreatingChat(true);
    try {
      const newConvo = await createConversation();
      dispatch(addConversation(newConvo));
      dispatch(setActiveConversation(newConvo._id));
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setCreatingChat(false);
    }
  };

  // ─── Logout ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      dispatch(clearUser());
      dispatch(resetConversations());
      setLoggingOut(false);
    }
  };

  const avatarColor = user ? getAvatarColor(user.name || user.email || "") : "#6C5CE7";
  const initials = user ? getInitials(user.name) : "U";

  return (
    <aside
      className="sidebar-transition flex flex-col h-full overflow-hidden"
      style={{
        width: isCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
        minWidth: isCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ minHeight: "56px" }}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center rounded-lg cursor-pointer"
          style={{
            width: "32px",
            height: "32px",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {!isCollapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <span
              className="font-semibold text-sm tracking-wide"
              style={{ color: "var(--text-primary)" }}
            >
              NOVA AI
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "var(--accent-muted)",
                color: "var(--accent)",
                fontSize: "10px",
                letterSpacing: "0.5px",
              }}
            >
              {userPlan}
            </span>
          </div>
        )}
      </div>

      {/* ─── New Chat Button ─────────────────────────────────────── */}
      <div className="px-3 mb-2">
        <button
          onClick={handleNewChat}
          disabled={creatingChat}
          className="flex items-center gap-2 rounded-xl cursor-pointer w-full"
          style={{
            padding: isCollapsed ? "10px 0" : "10px 14px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            background: "var(--accent)",
            color: "#FFFFFF",
            border: "none",
            fontSize: "13px",
            fontWeight: "500",
            transition: "background 0.2s, transform 0.1s, box-shadow 0.2s",
            boxShadow: "0 2px 8px var(--accent-glow)",
            opacity: creatingChat ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!creatingChat) {
              e.currentTarget.style.background = "var(--accent-hover)";
              e.currentTarget.style.boxShadow = "0 4px 16px var(--accent-glow)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 2px 8px var(--accent-glow)";
          }}
          onMouseDown={(e) => {
            if (!creatingChat) e.currentTarget.style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <SquarePen size={16} />
          {!isCollapsed && <span>{creatingChat ? "Creating..." : "New Chat"}</span>}
        </button>
      </div>

      {/* ─── Conversation List ───────────────────────────────────── */}
      {!isCollapsed && (
        <div
          className="flex-1 overflow-y-auto custom-scrollbar px-3 py-1 animate-fade-in"
          style={{ minHeight: 0 }}
        >
          {loading ? (
            /* Loading shimmer */
            <div className="flex flex-col gap-2 mt-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer"
                  style={{
                    height: "40px",
                    borderRadius: "10px",
                    opacity: 1 - i * 0.15,
                  }}
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            /* Empty state */
            <div
              className="flex flex-col items-center justify-center gap-3 py-12 animate-fade-in"
              style={{ color: "var(--text-muted)" }}
            >
              <MessagesSquare size={32} strokeWidth={1.2} />
              <p className="text-xs text-center" style={{ maxWidth: "160px", lineHeight: "1.5" }}>
                No recent conversations. Click "New Chat" to get started.
              </p>
            </div>
          ) : (
            /* Conversation rows */
            <div className="flex flex-col gap-0.5 mt-1">
              {conversations.map((convo) => {
                const isActive = convo._id === activeConversationId;
                return (
                  <button
                    key={convo._id}
                    onClick={() => dispatch(setActiveConversation(convo._id))}
                    className="flex items-center gap-2.5 rounded-lg text-left w-full cursor-pointer"
                    style={{
                      padding: "9px 12px",
                      background: isActive ? "var(--bg-active)" : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      transition: "all 0.15s ease",
                      fontSize: "13px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--bg-hover)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    <MessageSquare
                      size={14}
                      style={{
                        flexShrink: 0,
                        color: isActive ? "var(--accent)" : "var(--text-muted)",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate font-medium"
                        style={{ fontSize: "13px", margin: 0 }}
                      >
                        {convo.title || "New Conversation"}
                      </p>
                      <p
                        className="truncate"
                        style={{
                          fontSize: "10px",
                          margin: 0,
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {formatDate(convo.lastMessageAt || convo.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Spacer when collapsed to push footer down */}
      {isCollapsed && <div className="flex-1" />}

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <div
        className="mt-auto px-3 py-3"
        style={{
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="flex items-center gap-3 rounded-xl"
          style={{
            padding: isCollapsed ? "4px 0" : "8px 10px",
            justifyContent: isCollapsed ? "center" : "flex-start",
            flexDirection: isCollapsed ? "column" : "row",
            gap: isCollapsed ? "8px" : "10px",
          }}
        >
          {/* Avatar */}
          {user?.photoURL && !imgError ? (
            <img
              src={user.photoURL}
              alt={user.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="rounded-full object-cover"
              style={{
                width: isCollapsed ? "28px" : "34px",
                height: isCollapsed ? "28px" : "34px",
                flexShrink: 0,
                border: "2px solid var(--border-subtle)",
              }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center font-semibold"
              style={{
                width: isCollapsed ? "28px" : "34px",
                height: isCollapsed ? "28px" : "34px",
                flexShrink: 0,
                backgroundColor: avatarColor,
                color: "#fff",
                fontSize: isCollapsed ? "10px" : "12px",
              }}
            >
              {initials}
            </div>
          )}

          {/* User info + action icons */}
          {!isCollapsed && (
            <div className="flex items-center flex-1 min-w-0 gap-2 animate-fade-in">
              <div className="flex-1 min-w-0">
                <p
                  className="truncate font-medium"
                  style={{
                    fontSize: "13px",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  {user?.name || "User"}
                </p>
                <p
                  className="truncate"
                  style={{
                    fontSize: "10px",
                    margin: 0,
                    color: "var(--text-muted)",
                    marginTop: "1px",
                  }}
                >
                  {user?.email}
                </p>
              </div>

              {/* Coins / Billing button */}
              <button
                onClick={onOpenBilling}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: "var(--accent-muted)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--accent)",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent-muted)";
                }}
                title="Billing & Credits"
              >
                <Coins size={14} />
                <span className="text-xs font-semibold">{userCredits}</span>
              </button>

              {/* Logout icon */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center rounded-lg cursor-pointer"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  transition: "background 0.2s, color 0.2s",
                  flexShrink: 0,
                  opacity: loggingOut ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loggingOut) {
                    e.currentTarget.style.background = "rgba(231, 76, 92, 0.1)";
                    e.currentTarget.style.color = "var(--danger)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Collapsed: show Coins icon button & logout icon */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenBilling}
                className="flex flex-col items-center justify-center rounded-lg cursor-pointer p-1.5 relative"
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  border: "none",
                }}
                title={`Credits: ${userCredits} — Click to open Billing`}
              >
                <Coins size={16} />
                <span style={{ fontSize: "9px", fontWeight: "700", marginTop: "1px" }}>
                  {userCredits > 999 ? "999+" : userCredits}
                </span>
              </button>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center rounded-lg cursor-pointer"
                style={{
                  width: "28px",
                  height: "28px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  transition: "background 0.2s, color 0.2s",
                  opacity: loggingOut ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loggingOut) {
                    e.currentTarget.style.background = "rgba(231, 76, 92, 0.1)";
                    e.currentTarget.style.color = "var(--danger)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
