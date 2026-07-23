import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";

dotenv.config();

const port  = process.env.port


const app = express();

app.use("/auth",proxy(process.env.AUTH_SERVICE))

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})