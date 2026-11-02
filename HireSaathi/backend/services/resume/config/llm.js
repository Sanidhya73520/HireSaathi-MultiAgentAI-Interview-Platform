import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
dotenv.config();

const llm = new ChatGroq({
  model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  temperature: 0.2,
  maxTokens: 2500,
  maxRetries: 2,
  ...(process.env.GROQ_API_KEY ? { apiKey: process.env.GROQ_API_KEY } : {}),
});

export default llm;
