// import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./configs/db.js";
import roadmapRouter from "./routes/roadmap.route.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 6004;

app.use(express.json());

app.use("/", roadmapRouter);

app.listen(PORT, () => {
  console.log(`Roadmap service started on ${PORT}`);
  connectDB();
});
