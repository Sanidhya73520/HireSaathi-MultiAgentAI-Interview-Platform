import hrInterviewPrompt from "../prompt/hrInterviewPrompt.js";
import technicalInterviewPrompt from "../prompt/technicalInterviewPrompt.js";
import llm from "../config/llm.js";
export const interviewAgent = async (data) => {
  try {
    const prompt =
      data.type?.toLowerCase() === "hr"
        ? hrInterviewPrompt(data)
        : technicalInterviewPrompt(data);

    const response = await llm.invoke(prompt);
    const cleaned = response.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.log("Interview Agent parse error");
    console.log(response.content);
    throw new Error("Failed to generate interview questions.");
  }
};
