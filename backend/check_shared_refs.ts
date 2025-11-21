
import mongoose from "mongoose";
import dotenv from "dotenv";
import SharedChallenge from "./src/models/sharedChallengeModel";
import Challenge from "./src/models/challengeModel";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to DB");

        const shared = await SharedChallenge.find({});
        console.log(`Total Shared Challenges: ${shared.length}`);

        for (const s of shared) {
            const challenge = await Challenge.findById(s.challenge);
            console.log(`Shared ID: ${s._id}, Challenge ID: ${s.challenge}, Challenge Found: ${!!challenge}`);
            if (challenge) {
                console.log(`   Challenge Name: ${challenge.name}`);
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
