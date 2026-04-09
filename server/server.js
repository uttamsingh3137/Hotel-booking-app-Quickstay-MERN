import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import clerkWebHooks from "./controller/clerkWebHooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import { stripeWebhooks } from "./controller/stripeWebhooks.js";

connectDB();
connectCloudinary();

const app = express();
app.use(cors());

//api to listen to stripe webhooks
api.post('/api/stripe',express.raw({type : "application/json"}), stripeWebhooks)


//Middleware
app.use(express.json());
app.use(clerkMiddleware());

// Api to listen to clerk webhooks
app.use("/api/clerk", clerkWebHooks);

app.get("/", (req, res) => res.send("API is working"));
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
