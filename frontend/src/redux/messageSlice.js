import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],    // [{_id, role, content, createdAt}]
  loading: true,   // true while fetching history for a newly-selected conversation
  sending: false,  // true while waiting for agent response after user hits send
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessages(state, action) {
      state.messages = action.payload;
      state.loading = false;
    },
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    setMessagesLoading(state, action) {
      state.loading = action.payload;
    },
    setSending(state, action) {
      state.sending = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
      state.loading = false;
      state.sending = false;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setMessagesLoading,
  setSending,
  clearMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
