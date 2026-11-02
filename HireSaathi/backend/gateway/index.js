import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import { getCurrentUser } from "./controller/user.controller.js";
import { isAuth } from "./middleware/isAuth.js";
import { proxyWithHeaders } from "./utils/proxyWithHeaders.js";

// Optional internal fallback routers
import authRouter from "../services/auth/routes/auth.route.js";
import resumeRouter from "../services/resume/routes/resume.routes.js";
import interviewRouter from "../services/interview/routes/interview.route.js";
import roadmapRouter from "../services/roadmap/routes/roadmap.route.js";
import billingRouter from "../services/billing/routes/billing.route.js";

dotenv.config();

const PORT = process.env.PORT || 8000;
const app = express();

// Trust reverse proxy (needed for secure cookies on Render)
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

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
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      const isAllowed =
        allowedOrigins.some((allowed) => allowed.replace(/\/$/, "") === cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app");
      return callback(null, isAllowed ? true : true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  }),
);

const injectUserHeader = (req, res, next) => {
  if (req.user && req.user.userId) {
    req.headers["x-user-id"] = req.user.userId.toString();
  }
  next();
};

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Hello from HireSaathi Gateway" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Services routing: Proxies to microservices if URLs provided, otherwise routes internally
if (process.env.AUTH_SERVICE_URL) {
  app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL));
} else {
  app.use("/api/auth", authRouter);
}

if (process.env.RESUME_SERVICE_URL) {
  app.use("/api/resume", isAuth, proxyWithHeaders(process.env.RESUME_SERVICE_URL));
} else {
  app.use("/api/resume", isAuth, injectUserHeader, resumeRouter);
}

if (process.env.INTERVIEW_SERVICE_URL) {
  app.use("/api/interview", isAuth, proxyWithHeaders(process.env.INTERVIEW_SERVICE_URL));
} else {
  app.use("/api/interview", isAuth, injectUserHeader, interviewRouter);
}

if (process.env.ROADMAP_SERVICE_URL) {
  app.use("/api/roadmap", isAuth, proxyWithHeaders(process.env.ROADMAP_SERVICE_URL));
} else {
  app.use("/api/roadmap", isAuth, injectUserHeader, roadmapRouter);
}

if (process.env.BILLING_SERVICE_URL) {
  app.use("/api/billing", isAuth, proxyWithHeaders(process.env.BILLING_SERVICE_URL));
} else {
  app.use("/api/billing", isAuth, injectUserHeader, billingRouter);
}

app.get("/api/me", isAuth, getCurrentUser);

const startGateway = async () => {
  if (process.env.MONGODB_URL) {
    try {
      await mongoose.connect(process.env.MONGODB_URL);
      console.log("✅ MongoDB connected via Gateway");
    } catch (e) {
      console.error("❌ MongoDB connection error:", e.message);
    }
  }
  app.listen(PORT, () => {
    console.log(`Gateway started on ${PORT}`);
  });
};

startGateway();
