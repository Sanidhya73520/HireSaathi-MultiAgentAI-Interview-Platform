
import llm from "../config/llm.js";
import feedbackInterviewPrompt from "../prompt/feedbackInterviewPrompt.js"
export const feedbackAgent = async (data) => {
  try {
    const prompt =feedbackInterviewPrompt(data)

    const response = await llm.invoke(prompt);
    const cleaned = response.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.log("Feedback Agent parse error");
    console.log(response.content);
    throw new Error("Failed to generate feedback.");
  }
};
