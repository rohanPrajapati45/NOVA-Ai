import { Annotation } from "@langchain/langgraph";

/**
 * Shared LangGraph state schema for the multi-agent workflow.
 *
 * This state flows through: router → selected agent(s) → END
 * Each node reads what it needs and returns partial updates.
 */
const AgentState = Annotation.Root({
  /** The incoming user message */
  userPrompt: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  /** MongoDB ObjectId of the conversation (from chat service) */
  conversationId: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  /** Authenticated user's ID (forwarded from gateway via x-user-id header) */
  userId: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  /** Recent message history [{role, content}] fetched from Redis/MongoDB */
  chatHistory: Annotation({
    reducer: (_, next) => next,
    default: () => [],
  }),

  /**
   * Frontend manual agent override. null = auto-classify via router LLM.
   * One of: 'chat', 'search', 'coding', 'pdf', 'ppt', 'image', or null.
   */
  agentOverride: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /** Set by router node — one of: 'chat', 'search', 'coding', 'pdf', 'ppt', 'image' */
  selectedAgent: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  /**
   * Refined search query produced by chat.agent.js during the search flow.
   * chat.agent.js strips conversational filler and resolves pronouns from
   * the raw userPrompt using chatHistory context.
   * Kept separate from userPrompt so the original prompt is preserved
   * for message-saving and display purposes.
   */
  refinedQuery: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  /** Final agent output text — returned to the client */
  response: Annotation({
    reducer: (_, next) => next,
    default: () => "",
  }),

  /**
   * Raw search results from Tavily, kept separate from the synthesized
   * text response so the frontend can render images independently.
   * Shape: { textResults: [{title, url, content}], images: [{url}] } | null
   */
  searchResults: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),

  /**
   * Intermediate data passed between nodes in multi-hop flows.
   * Used by the search flow: chat agent → search agent.
   * Each step appends to this array.
   */
  intermediateSteps: Annotation({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  /** Error message for graceful error propagation through the graph */
  error: Annotation({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

export default AgentState;
