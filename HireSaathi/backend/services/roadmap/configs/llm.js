import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
dotenv.config();

const rawKey = process.env.GROQ_API_KEY
  ? process.env.GROQ_API_KEY.trim().replace(/^["']|["']$/g, "")
  : "";
const rawModel = process.env.GROQ_MODEL
  ? process.env.GROQ_MODEL.trim().replace(/^["']|["']$/g, "")
  : "";

const primaryModel =
  rawModel && rawModel !== "llama-3.3-70b-versatile"
    ? rawModel
    : "openai/gpt-oss-120b";

const candidateModels = [
  primaryModel,
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama-3.1-8b-instant",
  "qwen/qwen3.8-27b",
];

const uniqueModels = [...new Set(candidateModels)];

const createLlm = (modelName) =>
  new ChatGroq({
    model: modelName,
    temperature: 0.2,
    maxTokens: 4000,
    maxRetries: 1,
    ...(rawKey ? { apiKey: rawKey } : {}),
  });

const primaryLlm = createLlm(uniqueModels[0]);
const fallbackLlms = uniqueModels.slice(1).map(createLlm);

const llm =
  fallbackLlms.length > 0
    ? primaryLlm.withFallbacks({ fallbacks: fallbackLlms })
    : primaryLlm;

export default llm;
