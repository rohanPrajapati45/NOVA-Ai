import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const port  = process.env.port


const app = express();

app.get("/",(req,res)=>{
    res.json({message:"Auth Service is running"})
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    connectDB()
})