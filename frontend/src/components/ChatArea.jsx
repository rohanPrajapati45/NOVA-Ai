import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setMessages, setMessagesLoading, clearMessages } from "../redux/messageSlice";
import { getMessages } from "../features/getMessages";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

/**
 * ChatArea — orchestrates Nav, MessageList, and ChatInput.
 * Fetches message history when activeConversationId changes.
 * Manages draftMessage state (shared between MessageList's example cards
 * and ChatInput's controlled textarea) and artifacts panel toggle.
 */
const ChatArea = ({ isArtifactsOpen, onToggleArtifacts }) => {
  const dispatch = useDispatch();
  const { activeConversationId } = useSelector((state) => state.conversation);
  const [draftMessage, setDraftMessage] = useState("");

  // ─── Fetch messages when active conversation changes ────────────
  useEffect(() => {
    if (!activeConversationId) {
      dispatch(clearMessages());
      return;
    }

    const fetchMessages = async () => {
      dispatch(setMessagesLoading(true));
      try {
        const data = await getMessages(activeConversationId);
        dispatch(setMessages(data || []));
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        dispatch(setMessages([]));
      }
    };

    fetchMessages();
  }, [activeConversationId, dispatch]);

  return (
    <div
      className="flex flex-col flex-1 h-full min-w-0"
      style={{ background: "var(--bg-base)" }}
    >
      <Nav
        isArtifactsOpen={isArtifactsOpen}
        onToggleArtifacts={onToggleArtifacts}
      />
      <MessageList
        activeConversationId={activeConversationId}
        setDraftMessage={setDraftMessage}
      />
      <ChatInput
        draftMessage={draftMessage}
        setDraftMessage={setDraftMessage}
      />
    </div>
  );
};

export default ChatArea;
