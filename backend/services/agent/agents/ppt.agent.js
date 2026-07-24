import { pptModel } from "../config/llmModel.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// TODO: Wire a slide generation library here (e.g. PptxGenJS or python-pptx via subprocess)
// When wired, the flow will be:
//   1. This agent generates structured slide content (title, bullets, notes per slide)
//   2. A downstream step converts the structured content into an actual .pptx file
//   3. The file is returned to the user as a downloadable attachment
// For now, this agent outputs structured text content for a presentation.

const SYSTEM_PROMPT = `You are a presentation content specialist.
Your job is to create well-structured presentation slide content based on the user's topic.

Output format for each slide:
## Slide [number]: [Slide Title]
- Bullet point 1
- Bullet point 2
- Bullet point 3
**Speaker Notes:** Brief notes for the presenter.

Guidelines:
- Create 5-10 slides unless the user specifies a count.
- Start with a title slide and end with a summary/conclusion slide.
- Keep bullet points concise (max 8 words each).
- Include speaker notes with additional context.
- Use a logical flow: introduction → key points → details → conclusion.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  ["human", "{userPrompt}"],
]);

/**
 * PPT agent node — handles presentation/slide creation requests.
 * STUBBED: Outputs structured text content, not actual .pptx files yet.
 * Uses Gemini 1.5 Flash for reasoning + structured content generation.
 */
export const pptAgent = async (state) => {
  try {
    const chain = prompt.pipe(pptModel);
    const result = await chain.invoke({ userPrompt: state.userPrompt });

    return { response: result.content };
  } catch (error) {
    console.error("PPT agent error:", error.message);
    return {
      response: "I'm sorry, I couldn't generate your presentation. Please try again.",
      error: error.message,
    };
  }
};
