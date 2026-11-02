import redis from "../../../shared/redis/redis.js";
import graph from "../graphs/roadmap.graph.js";
import Roadmap from "../models/roadmap.model.js";

export const generateRoadmap = async (req, res) => {
  try {
    const { role, targetPackage, useResume = false, resume } = req.body;
    const userId = req.headers["x-user-id"];

    if (!role || !targetPackage) {
      return res.status(400).json({
        success: false,
        message: "Role and Target Package are required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required (x-user-id header missing)",
      });
    }

    console.log(`[Roadmap] Invoking graph for role: ${role}, useResume: ${Boolean(useResume && resume)}`);

    const result = await graph.invoke({
      role,
      targetPackage,
      useResume: Boolean(useResume && resume && resume.skills),
      resume: resume || null,
    });

    if (!result || !result.roadmap) {
      throw new Error("AI roadmap graph produced an empty response");
    }

    const roadmap = await Roadmap.create({
      userId,
      ...result.roadmap,
    });

    try {
      await redis.set(
        `roadmap:${roadmap._id}`,
        JSON.stringify(roadmap),
        "EX",
        60 * 60,
      );
      await redis.del(`userRoadmaps:${userId}`);
    } catch (redisErr) {
      console.warn("Redis caching note:", redisErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Roadmap generated successfully",
      data: roadmap,
    });
  } catch (error) {
    console.error("Roadmap generation error:", error);

    const errorMessage =
      error?.response?.data?.error?.message ||
      error.message ||
      "Failed to generate roadmap";

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

export const getAllRoadmap = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    try {
      const cache = await redis.get(`userRoadmaps:${userId}`);
      if (cache) {
        return res.status(200).json({
          success: true,
          fromCache: true,
          data: JSON.parse(cache),
        });
      }
    } catch (redisErr) {
      console.warn("Redis get note:", redisErr.message);
    }

    const roadmap = await Roadmap.find({ userId }).sort({
      createdAt: -1,
    });

    try {
      await redis.set(
        `userRoadmaps:${userId}`,
        JSON.stringify(roadmap),
        "EX",
        60 * 60,
      );
    } catch (redisErr) {
      console.warn("Redis set note:", redisErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Roadmaps fetched successfully.",
      data: roadmap,
    });
  } catch (error) {
    console.error("getAllRoadmap Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRoadmapbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers["x-user-id"];

    try {
      const cache = await redis.get(`roadmap:${id}`);
      if (cache) {
        return res.status(200).json({
          success: true,
          fromCache: true,
          data: JSON.parse(cache),
        });
      }
    } catch (redisErr) {
      console.warn("Redis get note:", redisErr.message);
    }

    const roadmap = await Roadmap.findOne({
      _id: id,
      userId: userId,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found",
      });
    }

    try {
      await redis.set(`roadmap:${id}`, JSON.stringify(roadmap), "EX", 60 * 60);
    } catch (redisErr) {
      console.warn("Redis set note:", redisErr.message);
    }

    return res.status(200).json({
      success: true,
      fromCache: false,
      data: roadmap,
    });
  } catch (error) {
    console.error("getRoadmapbyId Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
