import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],          // [{_id, title, lastMessageAt, createdAt, ...}]
  activeConversationId: null,  // Currently selected conversation
  loading: true,               // true while initial fetch is in-flight
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setConversations(state, action) {
      state.conversations = action.payload;
      state.loading = false;
    },
    addConversation(state, action) {
      // Prepend to front (most recent first)
      state.conversations.unshift(action.payload);
    },
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
    },
    setConversationsLoading(state, action) {
      state.loading = action.payload;
    },
    resetConversations(state) {
      state.conversations = [];
      state.activeConversationId = null;
      state.loading = false;
    },
  },
});

export const {
  setConversations,
  addConversation,
  setActiveConversation,
  setConversationsLoading,
  resetConversations,
} = conversationSlice.actions;

export default conversationSlice.reducer;
