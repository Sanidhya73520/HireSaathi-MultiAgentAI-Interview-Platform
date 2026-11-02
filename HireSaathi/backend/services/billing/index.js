// import "dotenv/config";
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import billingRouter from "./routes/billing.route.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6005;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Billing service");
});

app.use("/", billingRouter);

app.listen(PORT, () => {
  console.log(`Billing service started on ${PORT}`);
  connectDB();
});
