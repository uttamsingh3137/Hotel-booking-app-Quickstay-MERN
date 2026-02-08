import express from "express"
import "dotenv/config"
import cors from "cors"
import connectDB from "./configs/db.js"
import { clerkMiddleware } from '@clerk/express'
import clerkWebHooks from "./controller/clerkWebHooks.js"

connectDB()
const app = express()
app.use(cors())

//Middleware
app.use(express.json())
app.use(clerkMiddleware())


// Api to listen to clerk webhooks
app.use("/api/clerk", clerkWebHooks)



app.get('/', (req,res)=> res.send("API is working"))

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));

 