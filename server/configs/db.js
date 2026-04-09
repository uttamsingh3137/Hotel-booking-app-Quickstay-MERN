import mongoose from "mongoose";

const connectDB = async () => {
    try { 
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined");
        }
        mongoose.connection.on("connected", () => {
            console.log("DB connected successfully");
        });
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "hotel-booking-app",
            serverSelectionTimeoutMS: 10000,
        });
    }catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

export default connectDB;