// import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import resumeRouter from "./routes/resume.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6001;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Resume service");
});

app.use("/",resumeRouter)
app.listen(PORT, () => {
  console.log(`Resume service started on ${PORT}`);
  connectDB()
});
