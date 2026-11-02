import llm from "../config/llm.js";
import feedbackInterviewPrompt from "../prompt/feedbackInterviewPrompt.js";

const parseAiJson = (text) => {
  if (typeof text !== "string") {
    text = JSON.stringify(text);
  }
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  const firstBracket = cleaned.indexOf("[");
  const firstBrace = cleaned.indexOf("{");

  let startIdx = -1;
  let endIdx = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf("]");
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf("}");
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned);
};

export const feedbackAgent = async (data) => {
  try {
    const prompt = feedbackInterviewPrompt(data);
    const response = await llm.invoke(prompt);
    let content = response?.content || "";
    if (Array.isArray(content)) {
      content = content.map((item) => (typeof item === "string" ? item : item.text || "")).join("");
    }

    return parseAiJson(content);
  } catch (error) {
    console.error("Feedback Agent Error:", error.message);
    throw new Error(`Failed to generate feedback: ${error.message}`);
  }
};
