import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import llm from "../config/llm.js";

export const resumeAgent = async (resumeText) => {
  const response = await llm.invoke([
    new SystemMessage(`You are an Expert ATS Resume Analyzer.
Analyze the given resume.
Extract the following information as strict JSON matching this schema:
{
  "name": "",
  "email": "",
  "phone": "",
  "summary": "",
  "skills": [],
  "projects": [
    { "title": "", "technologies": [], "description": "" }
  ],
  "education": [
    { "institution": "", "degree": "", "duration": "", "cgpa": "", "grade": "", "year": "" }
  ],
  "experience": [
    { "title": "", "company": "", "duration": "", "responsibilities": [] }
  ],
  "strengths": [],
  "weaknesses": [],
  "missingSkills": [],
  "suggestedRole": "",
  "score": 0,
  "recommendations": []
}

IMPORTANT RULES:
1. Return ONLY valid raw JSON.
2. Do not include markdown blocks (\`\`\`json).
3. Do not include thought tags or extra conversational text.
4. "score" must be a number from 0 to 100.
5. Every field must exist.`),
    new HumanMessage(resumeText),
  ]);

  return response.content;
};
