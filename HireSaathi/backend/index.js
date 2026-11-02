import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import proxy from "express-http-proxy";

// Import routers for monolithic / unified mode
import authRouter from "./services/auth/routes/auth.route.js";
import resumeRouter from "./services/resume/routes/resume.routes.js";
import interviewRouter from "./services/interview/routes/interview.route.js";
import roadmapRouter from "./services/roadmap/routes/roadmap.route.js";
import billingRouter from "./services/billing/routes/billing.route.js";

// Import gateway utilities and controllers
import { isAuth } from "./gateway/middleware/isAuth.js";
import { getCurrentUser } from "./gateway/controller/user.controller.js";
import { proxyWithHeaders } from "./gateway/utils/proxyWithHeaders.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// Enable trust proxy for secure cookies behind reverse proxies (Render, Cloudflare, etc.)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Flexible CORS configuration supporting production Vercel frontend, local dev, and preview URLs
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : null,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");
      const isExplicitlyAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/$/, "") === cleanOrigin,
      );

      // Also allow any vercel.app preview deployments
      const isVercel = cleanOrigin.endsWith(".vercel.app");

      if (isExplicitlyAllowed || isVercel) {
        return callback(null, true);
      }

      console.warn(`[CORS] Request from origin '${origin}' allowed by wildcard fallback`);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  }),
);

// Middleware to inject user ID into headers for unified internal routing
const injectUserHeader = (req, res, next) => {
  const id = req.user?.userId || req.user?._id;
  if (id) {
    req.headers["x-user-id"] = id.toString();
  }
  next();
};

// Health Check Routes
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "HireSaathi Backend API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// User profile route
app.get("/api/me", isAuth, getCurrentUser);

// --- Route Dispatcher: Microservices vs Monolith ---
// If microservice URLs are set in environment, proxy to them.
// Otherwise, serve them directly inside this process (ideal for Render deployment).

if (process.env.AUTH_SERVICE_URL) {
  console.log(`[Mode] Auth -> Proxying to ${process.env.AUTH_SERVICE_URL}`);
  app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL));
} else {
  console.log("[Mode] Auth -> Running internally");
  app.use("/api/auth", authRouter);
}

if (process.env.RESUME_SERVICE_URL) {
  console.log(`[Mode] Resume -> Proxying to ${process.env.RESUME_SERVICE_URL}`);
  app.use("/api/resume", isAuth, proxyWithHeaders(process.env.RESUME_SERVICE_URL));
} else {
  console.log("[Mode] Resume -> Running internally");
  app.use("/api/resume", isAuth, injectUserHeader, resumeRouter);
}

if (process.env.INTERVIEW_SERVICE_URL) {
  console.log(`[Mode] Interview -> Proxying to ${process.env.INTERVIEW_SERVICE_URL}`);
  app.use("/api/interview", isAuth, proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL));
} else {
  console.log("[Mode] Interview -> Running internally");
  app.use("/api/interview", isAuth, injectUserHeader, interviewRouter);
}

if (process.env.ROADMAP_SERVICE_URL) {
  console.log(`[Mode] Roadmap -> Proxying to ${process.env.ROADMAP_SERVICE_URL}`);
  app.use("/api/roadmap", isAuth, proxyWithHeaders(process.env.ROADMAP_SERVICE_URL));
} else {
  console.log("[Mode] Roadmap -> Running internally");
  app.use("/api/roadmap", isAuth, injectUserHeader, roadmapRouter);
}

if (process.env.BILLING_SERVICE_URL) {
  console.log(`[Mode] Billing -> Proxying to ${process.env.BILLING_SERVICE_URL}`);
  app.use("/api/billing", isAuth, proxyWithHeaders(process.env.BILLING_SERVICE_URL));
} else {
  console.log("[Mode] Billing -> Running internally");
  app.use("/api/billing", isAuth, injectUserHeader, billingRouter);
}

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 [Global Express Error]:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Connect to MongoDB & Start Server
const startServer = async () => {
  if (process.env.MONGODB_URL) {
    try {
      await mongoose.connect(process.env.MONGODB_URL);
      console.log("✅ MongoDB Connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error.message);
    }
  } else {
    console.warn("⚠️ MONGODB_URL is not defined in environment variables!");
  }

  app.listen(PORT, () => {
    console.log(`🚀 HireSaathi Server started on port ${PORT}`);
  });
};

startServer();
