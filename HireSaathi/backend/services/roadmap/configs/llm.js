//                      ┌──────────────┐
//                      │     User     │
//                      └──────┬───────┘
//                             │
//                             ▼
//                 ┌─────────────────────┐
//                 │      Frontend       │
//                 └──────────┬──────────┘
//                            │
//                            ▼
//                 ┌─────────────────────┐
//                 │ POST /generate-     │
//                 │       Roadmap       │
//                 └──────────┬──────────┘
//                            │
//                            ▼
//                 ┌─────────────────────┐
//                 │  Roadmap Controller │
//                 └──────────┬──────────┘
//                            │
//                            ▼
//                 ┌─────────────────────┐
//                 │ graph.invoke(state) │
//                 │     LangGraph       │
//                 └──────────┬──────────┘
//                            │
//                            ▼
//                 ┌─────────────────────┐
//                 │ State = RoadmapState│
//                 └──────────┬──────────┘
//                            │
//                            ▼
//           ┌──────────────────────────────┐
//           │        roadMapAgent          │
//           │      Groq / Llama 3.3        │
//           └──────────────┬───────────────┘
//                          │
//                          ▼
//           ┌──────────────────────────────┐
//           │  Personalized Roadmap JSON   │
//           └──────────────┬───────────────┘
//                          │
//                          ▼
//           ┌──────────────────────────────┐
//           │        resourceAgent         │
//           └──────────────┬───────────────┘
//                          │
//               ┌──────────┴──────────┐
//               ▼                     ▼
//    ┌──────────────────┐   ┌──────────────────┐
//    │  YouTube Search  │   │  Documentation   │
//    │    Groq LLM      │   │     Groq LLM     │
//    └────────┬─────────┘   └────────┬─────────┘
//             │                      │
//             ▼                      ▼
//    ┌──────────────────┐   ┌──────────────────┐
//    │ YouTube Resources│   │ Documentation    │
//    │  Videos + Links  │   │ Articles + Links │
//    └────────┬─────────┘   └────────┬─────────┘
//             │                      │
//             └──────────┬───────────┘
//                        ▼
//           ┌──────────────────────────────┐
//           │     Roadmap + Resources      │
//           │        Merged Output         │
//           └──────────────┬───────────────┘
//                          │
//                          ▼
//           ┌──────────────────────────────┐
//           │      Save in Roadmap DB      │
//           │       (Roadmap Model)        │
//           └──────────────┬───────────────┘
//                          │
//                          ▼
//                      ┌───────┐
//                      │  END  │
//                      └───────┘

import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
dotenv.config();

const rawKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim().replace(/^["']|["']$/g, "") : "";
const rawModel = process.env.GROQ_MODEL ? process.env.GROQ_MODEL.trim().replace(/^["']|["']$/g, "") : "";
const model =
  rawModel && !rawModel.includes("gpt-oss") && !rawModel.startsWith("openai/")
    ? rawModel
    : "llama-3.3-70b-versatile";

if (!rawKey) {
  console.warn("⚠️ [Roadmap LLM] GROQ_API_KEY is not set or empty in environment variables!");
} else {
  console.log(`✅ [Roadmap LLM] Configured with model: ${model}`);
}

const llm = new ChatGroq({
  model,
  temperature: 0.2,
  maxTokens: 4000,
  maxRetries: 2,
  ...(rawKey ? { apiKey: rawKey } : {}),
});

export default llm;
