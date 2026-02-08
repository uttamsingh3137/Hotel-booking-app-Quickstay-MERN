import mongoose from "mongoose";

const connectDB = async () => {
    try { 
        mongoose.connection.on("connected", () => {
            console.log("DB connected successfully");
        });
        await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking-app`)
    }catch (error) {
        console.error(error.meassage);
    }
}

export default connectDB;