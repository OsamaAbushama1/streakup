
import mongoose from "mongoose";
import dotenv from "dotenv";
import SharedChallenge from "./src/models/sharedChallengeModel";
import User from "./src/models/userModel";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to DB");

        const shared = await SharedChallenge.find({});
        console.log(`Total Shared Challenges: ${shared.length}`);

        for (const s of shared) {
            console.log(`ID: ${s._id}, User: ${s.user}, Highlighted: ${s.highlighted}`);
        }

        // Check if any user has shared challenges but they are not showing up
        // We don't know the specific user ID of the current user, but we can see if *any* exist.

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
