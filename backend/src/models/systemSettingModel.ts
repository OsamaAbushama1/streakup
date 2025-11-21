import mongoose, { Schema } from "mongoose";

const systemSettingSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
});

export default mongoose.model("SystemSetting", systemSettingSchema);
