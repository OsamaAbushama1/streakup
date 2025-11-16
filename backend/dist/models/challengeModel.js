"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const challengeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    category: {
        type: String,
        required: true,
    },
    challengeId: { type: String, required: true, unique: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
    duration: { type: Number, required: true, min: 1 },
    points: { type: Number, required: true, min: 0 },
    participants: { type: Number, default: 0 },
    overview: { type: String, required: true },
    challengeDetails: { type: String, required: true },
    challengeSteps: { type: String, required: true },
    requirements: { type: String, required: true },
    previewImages: { type: [String], default: [] },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: [] }],
    shared: { type: Boolean, default: false },
    project: { type: mongoose_1.Schema.Types.ObjectId, ref: "Project", default: null },
});
challengeSchema.index({ category: 1, challengeId: 1 }, { unique: true });
exports.default = mongoose_1.default.model("Challenge", challengeSchema);
