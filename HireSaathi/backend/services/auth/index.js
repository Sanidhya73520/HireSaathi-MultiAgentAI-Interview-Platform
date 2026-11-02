import express from "express"
import dotenv from "dotenv"
import { connect } from "mongoose";
import { connectDB } from "./configs/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
dotenv.config()
const app=express()

const PORT=process.env.PORT||6001;

app.use(express.json());
app.use(cookieParser());

app.get("/",(req,res)=>{
    res.send("Hello from Auth");
    
})

app.use("/",authRouter)
app.listen(PORT,()=>{
    console.log(`Auth started on ${PORT}`);
    connectDB()
    
})