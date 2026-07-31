import { StateGraph, END } from "@langchain/langgraph";
import AgentState from "./state.js";
import { routerNode } from "./router.js";
import { creditCheckNode } from "./creditCheckNode.js";
import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { imageAgent } from "../agents/image.agent.js";

/**
 * Build the multi-agent LangGraph workflow with Credit Check Node.
 *
 * Flow:
 *   __start__ → router → creditCheckNode → (conditional edge)
 *     ├── creditCheckFailed == true  → END
 *     └── creditCheckFailed == false → selectedAgent (chatAgent | codingAgent | pdfAgent | pptAgent | imageAgent)
 *
 *   For "search" flow (two-hop):
 *     router → creditCheckNode → chatAgent → searchAgent → END
 */
const workflow = new StateGraph(AgentState)
  // ─── Add nodes ────────────────────────────────────────────────────
  .addNode("router", routerNode)
  .addNode("creditCheckNode", creditCheckNode)
  .addNode("chatAgent", chatAgent)
  .addNode("searchAgent", searchAgent)
  .addNode("codingAgent", codingAgent)
  .addNode("pdfAgent", pdfAgent)
  .addNode("pptAgent", pptAgent)
  .addNode("imageAgent", imageAgent)

  // ─── Entry point ──────────────────────────────────────────────────
  .addEdge("__start__", "router")
  .addEdge("router", "creditCheckNode")

  // ─── Conditional edge from creditCheckNode ─────────────────────────
  .addConditionalEdges("creditCheckNode", (state) => {
    if (state.creditCheckFailed) {
      return "__end__";
    }
    return state.selectedAgent;
  }, {
    __end__: END,
    chat: "chatAgent",
    search: "chatAgent", // Search flow: creditCheckNode → chatAgent → searchAgent
    coding: "codingAgent",
    pdf: "pdfAgent",
    ppt: "pptAgent",
    image: "imageAgent",
  })

  // ─── Search flow: two-hop chain ───────────────────────────────────
  .addConditionalEdges("chatAgent", (state) => {
    if (state.selectedAgent === "search") {
      return "searchAgent";
    }
    return "__end__";
  }, {
    searchAgent: "searchAgent",
    __end__: END,
  })

  // ─── Terminal edges ───────────────────────────────────────────────
  .addEdge("searchAgent", END)
  .addEdge("codingAgent", END)
  .addEdge("pdfAgent", END)
  .addEdge("pptAgent", END)
  .addEdge("imageAgent", END);

export const agentGraph = workflow.compile();
