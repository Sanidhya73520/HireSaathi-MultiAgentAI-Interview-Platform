import express from "express";
import {
  addCoins,
  GoogleAuth,
  logout,
  useCoins,
} from "../controllers/auth.controller.js";
const authRouter = express.Router();

authRouter.post("/login", GoogleAuth);

authRouter.get("/logout", logout);

authRouter.post("/use-coins", useCoins);

authRouter.post("/add-coins", addCoins);

export default authRouter;
