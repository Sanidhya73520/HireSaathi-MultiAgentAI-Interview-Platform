import hrInterviewPrompt from "../prompt/hrInterviewPrompt.js";
import technicalInterviewPrompt from "../prompt/technicalInterviewPrompt.js";
import llm from "../config/llm.js";

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

  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.questions)) return parsed.questions;
  return parsed;
};

export const interviewAgent = async (data) => {
  try {
    const prompt =
      data.type?.toLowerCase() === "hr"
        ? hrInterviewPrompt(data)
        : technicalInterviewPrompt(data);

    const response = await llm.invoke(prompt);
    let content = response?.content || "";
    if (Array.isArray(content)) {
      content = content.map((item) => (typeof item === "string" ? item : item.text || "")).join("");
    }

    const questions = parseAiJson(content);
    return Array.isArray(questions) ? questions : [questions];
  } catch (error) {
    console.error("Interview Agent Error:", error.message);
    throw new Error(`Failed to generate interview questions: ${error.message}`);
  }
};
