import llm from "../configs/llm.js";
import roadmapPrompt from "../configs/roadmap.prompt.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const roadmapAgent = async (state) => {
  try {
    const resume =
      state.useResume && state.resume
        ? {
            skills: state.resume.skills || [],
            missingSkills: state.resume.missingSkills || [],
            projects: state.resume.projects || [],
            experience: state.resume.experience || [],
            score: state.resume.score || 0,
            suggestedRole: state.resume.suggestedRole || "",
            recommendations: state.resume.recommendations || [],
          }
        : null;

    console.log(`[Roadmap] Calling LLM for role: ${state.role}, package: ${state.targetPackage}`);

    const response = await llm.invoke([
      new SystemMessage(roadmapPrompt),
      new HumanMessage(
        `Target Role: ${state.role} Target Package:${state.targetPackage} Resume:${JSON.stringify(resume, null, 2)}`,
      ),
    ]);

    let content = response.content;
    if (Array.isArray(content)) {
      content = content.map((item) => (typeof item === "string" ? item : item.text || "")).join("");
    }
    content = String(content || "");

    // 1. Remove <think>...</think> reasoning tags
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Remove markdown code blocks
    content = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

    // 3. Extract JSON object between first '{' and last '}'
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      content = content.substring(firstBrace, lastBrace + 1);
    }
    content = content.replace(/,\s*([}\]])/g, "$1");

    let roadmap;
    try {
      roadmap = JSON.parse(content);
    } catch (parseErr) {
      console.error("Roadmap Agent JSON parse error. Raw was:", response.content);
      throw new Error(`Failed to parse AI Roadmap JSON: ${parseErr.message}`);
    }

    const normalizeDifficulty = (val = "") => {
      const lower = String(val).toLowerCase();
      if (lower.includes("hard") || lower.includes("adv")) return "Hard";
      if (lower.includes("med") || lower.includes("inter")) return "Medium";
      return "Easy";
    };

    const normalizeLevel = (val = "") => {
      const lower = String(val).toLowerCase();
      if (lower.includes("adv")) return "Advanced";
      if (lower.includes("inter") || lower.includes("med")) return "Intermediate";
      return "Beginner";
    };

    roadmap.level = normalizeLevel(roadmap.level);
    roadmap.modules = (roadmap.modules || []).map((module) => ({
      ...module,
      difficulty: normalizeDifficulty(module.difficulty),
      title: String(module.title || "Module"),
      duration: String(module.duration || "1 week"),
      description: String(module.description || ""),
    }));

    return {
      ...state,
      roadmap,
    };
  } catch (error) {
    console.error("Roadmap Agent error:", error);
    throw error;
  }
};

export default roadmapAgent;
