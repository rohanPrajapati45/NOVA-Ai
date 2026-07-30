import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],    // [{_id, role, content, createdAt, artifactTitle, artifactFiles, searchImages}]
  loading: true,   // true while fetching history for a newly-selected conversation
  sending: false,  // true while waiting for agent response after user hits send
  activeArtifact: null, // { title: string, files: [{filename, language, content}] }
  isArtifactPanelOpen: false, // Controls visibility of the panel
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
      state.activeArtifact = null;
      state.isArtifactPanelOpen = false;
    },
    setActiveArtifact(state, action) {
      state.activeArtifact = action.payload;
      state.isArtifactPanelOpen = true; // Auto-opens on set
    },
    closeArtifactPanel(state) {
      state.isArtifactPanelOpen = false;
    },
    toggleArtifactPanel(state) {
      state.isArtifactPanelOpen = !state.isArtifactPanelOpen;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setMessagesLoading,
  setSending,
  clearMessages,
  setActiveArtifact,
  closeArtifactPanel,
  toggleArtifactPanel,
} = messageSlice.actions;

export default messageSlice.reducer;
