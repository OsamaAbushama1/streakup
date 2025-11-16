"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/createAdmin.ts
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userModel_1 = __importDefault(require("../models/userModel")); // تأكد من تعديل المسار حسب هيكلية مشروعك
const db_1 = __importDefault(require("../config/db")); // تأكد من تعديل المسار حسب هيكلية مشروعك
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // تحميل متغيرات البيئة من ملف .env
const createAdmin = async () => {
    try {
        // الاتصال بقاعدة البيانات
        await (0, db_1.default)();
        console.log("✅ تم الاتصال بقاعدة البيانات");
        // التحقق مما إذا كان الأدمن موجود بالفعل
        const adminEmail = "osama@gmail.com"; // يمكنك تغيير البريد الإلكتروني
        const existingAdmin = await userModel_1.default.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("⚠️ حساب الأدمن موجود بالفعل:", adminEmail);
            return;
        }
        // تشفير كلمة المرور
        const adminPassword = "osama123"; // استبدل بكلمة مرور قوية
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        // إنشاء حساب الأدمن
        const admin = await userModel_1.default.create({
            firstName: "Admin",
            lastName: "User",
            email: adminEmail,
            password: hashedPassword,
            role: "Admin", // تعيين الدور كـ admin
            track: "Backend Development", // اختياري
            skillLevel: "Advanced", // اختياري
            profilePicture: undefined, // اختياري: يمكنك إضافة صورة إذا لزم الأمر
        });
        console.log("✅ تم إنشاء حساب الأدمن بنجاح:", admin.email);
    }
    catch (error) {
        console.error("❌ خطأ أثناء إنشاء الأدمن:", error.message);
    }
    finally {
        // إغلاق الاتصال بقاعدة البيانات
        await mongoose_1.default.connection.close();
        console.log("🔌 تم إغلاق الاتصال بقاعدة البيانات");
    }
};
// تشغيل الدالة
createAdmin();
