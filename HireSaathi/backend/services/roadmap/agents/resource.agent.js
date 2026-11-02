import llm from "../configs/llm.js";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import searchVideo from "../configs/youtube.js";

const resourceAgent = async (state) => {
  try {
    const roadmap = state.roadmap;

    const moduleTitles = roadmap.modules
      .map((module) => module.title)
      .join("\n");

    const docsResponse = await llm.invoke([
      new SystemMessage(`You are an expert software engineer.

For every module below, find the official documentation or the best learning article.

Rules:
1. Prefer official documentation.
2. If official documentation does not exist, return the best learning article.
3. Return ONLY valid JSON.
4. Do not explain anything.
5. You MUST use the EXACT module title provided.
6. Return one object for every module.

Return format:
[
  {
    "title": "EXACT MODULE TITLE",
    "article": "URL"
  }
]`),

      new HumanMessage(`Modules:
${moduleTitles}`),
    ]);

    let docs = [];

    try {
      let content = docsResponse.content;

      if (Array.isArray(content)) {
        content = content.map((item) => item.text || "").join("");
      }

      docs = JSON.parse(
        content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim(),
      );
    } catch (error) {
      console.log("Documentation JSON parse error:", error.message);
      docs = [];
    }

    const docsMap = new Map();

    docs.forEach((item) => {
      if (item.title && item.article) {
        docsMap.set(item.title.trim().toLowerCase(), item.article);
      }
    });
    roadmap.modules = await Promise.all(
      roadmap.modules.map(async (module) => {
        let video = null;

        try {
          video = await searchVideo(module.title);
          console.log("YouTube result for:", module.title, video);
        } catch (err) {
          console.log("YouTube error:", err.response?.data || err.message);
        }

        return {
          ...module,
          youtube: video?.url || "",
          article: docsMap.get(module.title.trim().toLowerCase()) || "",
        };
      }),
    );

    return {
      ...state,
      roadmap,
    };
  } catch (error) {
    console.log("Resource Agent Error:", error);
    return state;
  }
};

export default resourceAgent;
