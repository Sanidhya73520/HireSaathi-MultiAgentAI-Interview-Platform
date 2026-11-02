import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs";

// Helper to safely extract and parse JSON from AI response
const parseAiJson = (text) => {
  if (typeof text !== "string") {
    text = JSON.stringify(text);
  }

  // 1. Remove <think>...</think> tags if model produces reasoning
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  // 3. Extract substring between first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 4. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(cleaned);
};

// Helper to sanitize resume fields for Mongoose schema compliance
const sanitizeResumeData = (raw) => {
  const sanitizeArrayOfStrings = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  };

  const sanitizeEducation = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      if (typeof item === "string") {
        return { degree: item, institution: "", duration: "", cgpa: "", grade: "", year: "" };
      }
      return {
        institution: String(item.institution || ""),
        degree: String(item.degree || ""),
        duration: String(item.duration || ""),
        cgpa: String(item.cgpa || ""),
        grade: String(item.grade || ""),
        year: String(item.year || ""),
      };
    });
  };

  const sanitizeProjects = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      if (typeof item === "string") {
        return { title: item, technologies: [], description: "" };
      }
      return {
        title: String(item.title || ""),
        technologies: sanitizeArrayOfStrings(item.technologies),
        description: String(item.description || ""),
      };
    });
  };

  const sanitizeExperience = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
      if (typeof item === "string") {
        return { title: item, company: "", duration: "", responsibilities: [] };
      }
      return {
        title: String(item.title || ""),
        company: String(item.company || ""),
        duration: String(item.duration || ""),
        responsibilities: sanitizeArrayOfStrings(item.responsibilities),
      };
    });
  };

  // Parse score as safe number
  let score = 0;
  if (raw.score !== undefined && raw.score !== null) {
    const num = Number(String(raw.score).replace(/[^0-9.]/g, ""));
    score = isNaN(num) ? 0 : Math.min(Math.max(Math.round(num), 0), 100);
  }

  return {
    name: String(raw.name || ""),
    email: String(raw.email || ""),
    phone: String(raw.phone || ""),
    summary: String(raw.summary || ""),
    skills: sanitizeArrayOfStrings(raw.skills),
    education: sanitizeEducation(raw.education),
    projects: sanitizeProjects(raw.projects),
    experience: sanitizeExperience(raw.experience),
    strengths: sanitizeArrayOfStrings(raw.strengths),
    weaknesses: sanitizeArrayOfStrings(raw.weaknesses),
    missingSkills: sanitizeArrayOfStrings(raw.missingSkills),
    recommendations: sanitizeArrayOfStrings(raw.recommendations),
    suggestedRole: String(raw.suggestedRole || ""),
    score,
  };
};

export const uploadResume = async (req, res) => {
  const file = req.file;

  const safeDeleteFile = () => {
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn("Failed to unlink temp file:", err.message);
      }
    }
  };

  try {
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required",
      });
    }

    const userId = req.headers["x-user-id"];
    if (!userId) {
      safeDeleteFile();
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    console.log(`[Resume] Extracting text from ${file.path}...`);
    const resumeText = await extractText(file.path);

    if (!resumeText || !resumeText.trim()) {
      safeDeleteFile();
      return res.status(400).json({
        success: false,
        message: "Could not extract text from PDF. The file may be empty or scanned as an image.",
      });
    }

    console.log(`[Resume] Analyzing resume text with AI (${resumeText.length} chars)...`);
    const aiResponse = await resumeAgent(resumeText);

    let rawData;
    try {
      rawData = parseAiJson(aiResponse);
    } catch (parseError) {
      console.error("AI JSON Parse Error. Raw response was:", aiResponse);
      throw new Error(`AI generated an invalid response format: ${parseError.message}`);
    }

    const resumeData = sanitizeResumeData(rawData);

    let resume = await Resume.findOne({ userId });
    if (resume) {
      Object.assign(resume, {
        ...resumeData,
        extractedText: resumeText,
      });
      await resume.save();
    } else {
      resume = await Resume.create({
        userId,
        extractedText: resumeText,
        ...resumeData,
      });
    }

    try {
      await redis.set(`resume:${userId}`, JSON.stringify(resume));
    } catch (redisErr) {
      console.warn("Redis cache update failed:", redisErr.message);
    }

    safeDeleteFile();

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: resume,
    });
  } catch (error) {
    safeDeleteFile();
    console.error("Upload Resume Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze resume",
    });
  }
};

export const getResume = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    try {
      const cache = await redis.get(`resume:${userId}`);
      if (cache) {
        return res.status(200).json({
          success: true,
          source: "redis",
          data: JSON.parse(cache),
        });
      }
    } catch (redisErr) {
      console.warn("Redis get failed:", redisErr.message);
    }

    const resume = await Resume.findOne({ userId });
    if (!resume) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "Resume not found",
      });
    }

    try {
      await redis.set(`resume:${userId}`, JSON.stringify(resume));
    } catch (redisErr) {
      console.warn("Redis set failed:", redisErr.message);
    }

    return res.status(200).json({
      success: true,
      source: "mongoDb",
      data: resume,
    });
  } catch (error) {
    console.error("Get Resume Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
