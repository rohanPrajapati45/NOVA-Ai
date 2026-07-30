import api from "../utils/axios";

/**
 * Send a prompt to the agent service.
 * The agent service runs the LangGraph, saves both user + assistant messages
 * to the chat service internally, and returns { response, selectedAgent, searchImages }.
 *
 * @param {string} conversationId
 * @param {string} userPrompt
 * @param {string|null} agentOverride - Manual agent selection from frontend.
 *   null = auto-classify via router LLM. One of: 'chat','search','coding','pdf','ppt','image'.
 */
export const sendMessage = async ({ conversationId, userPrompt, agentOverride = null }) => {
  const response = await api.post("/api/agent/prompt", {
    conversationId,
    userPrompt,
    agentOverride,
  });
  return response.data; // { response, selectedAgent, conversationId, searchImages, artifactTitle, artifactFiles, generatedImageUrl }
};
