
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/userModel";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to DB");

        const users = await User.find({});
        console.log(`Total Users: ${users.length}`);

        for (const u of users) {
            console.log(`ID: ${u._id}, Name: ${u.firstName} ${u.lastName}, Points: ${u.points}, Role: ${u.role}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
