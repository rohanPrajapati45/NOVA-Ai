import api from "../utils/axios";

/**
 * Send a prompt to the agent service.
 * The agent service runs the LangGraph, saves both user + assistant messages
 * to the chat service internally, and returns { response, selectedAgent }.
 * Lets real errors (500/network) throw — caller handles fallback UI.
 */
export const sendMessage = async ({ conversationId, userPrompt }) => {
  const response = await api.post("/api/agent/prompt", {
    conversationId,
    userPrompt,
  });
  return response.data; // { response, selectedAgent, conversationId }
};
