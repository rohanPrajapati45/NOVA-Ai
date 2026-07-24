import { StateGraph, END } from "@langchain/langgraph";
import AgentState from "./state.js";
import { routerNode } from "./router.js";
import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { imageAgent } from "../agents/image.agent.js";

/**
 * Build the multi-agent LangGraph workflow.
 *
 * Flow:
 *   __start__ → router → (conditional edge based on selectedAgent)
 *
 *   For "search" flow (two-hop):
 *     router → chatAgent → searchAgent → END
 *     (Chat agent reformulates/acknowledges, search agent does retrieval-augmented response)
 *
 *   For all other agents (single-hop):
 *     router → [chatAgent|codingAgent|pdfAgent|pptAgent|imageAgent] → END
 */
const workflow = new StateGraph(AgentState)
  // ─── Add nodes ────────────────────────────────────────────────────
  .addNode("router", routerNode)
  .addNode("chatAgent", chatAgent)
  .addNode("searchAgent", searchAgent)
  .addNode("codingAgent", codingAgent)
  .addNode("pdfAgent", pdfAgent)
  .addNode("pptAgent", pptAgent)
  .addNode("imageAgent", imageAgent)

  // ─── Entry point ──────────────────────────────────────────────────
  .addEdge("__start__", "router")

  // ─── Conditional edges from router ────────────────────────────────
  // Routes to the appropriate agent based on state.selectedAgent
  .addConditionalEdges("router", (state) => state.selectedAgent, {
    chat: "chatAgent",
    search: "chatAgent", // Search flow: router → chatAgent → searchAgent
    coding: "codingAgent",
    pdf: "pdfAgent",
    ppt: "pptAgent",
    image: "imageAgent",
  })

  // ─── Search flow: two-hop chain ───────────────────────────────────
  // After chatAgent, if this was a search request, continue to searchAgent.
  // Otherwise (direct chat), end the graph.
  .addConditionalEdges("chatAgent", (state) => {
    if (state.selectedAgent === "search") {
      return "searchAgent";
    }
    return "__end__";
  }, {
    searchAgent: "searchAgent",
    __end__: END,
  })

  // ─── Terminal edges (single-hop agents → END) ─────────────────────
  .addEdge("searchAgent", END)
  .addEdge("codingAgent", END)
  .addEdge("pdfAgent", END)
  .addEdge("pptAgent", END)
  .addEdge("imageAgent", END);

// Compile the graph into an invokable object
export const agentGraph = workflow.compile();
