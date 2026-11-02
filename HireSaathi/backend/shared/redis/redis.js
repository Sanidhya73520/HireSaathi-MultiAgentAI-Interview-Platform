import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.warn("⚠️ Redis retry limit reached. Redis may be unavailable.");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  enableOfflineQueue: true,
};

// Enable TLS for secure Redis connections (e.g. Upstash rediss://)
if (redisUrl.startsWith("rediss://")) {
  redisOptions.tls = {
    rejectUnauthorized: false,
  };
}

const redis = new Redis(redisUrl, redisOptions);

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

export default redis;
