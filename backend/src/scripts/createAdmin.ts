// scripts/createAdmin.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/userModel"; // تأكد من تعديل المسار حسب هيكلية مشروعك
import connectDB from "../config/db"; // تأكد من تعديل المسار حسب هيكلية مشروعك
import dotenv from "dotenv";

dotenv.config(); // تحميل متغيرات البيئة من ملف .env

const createAdmin = async () => {
  try {
    // الاتصال بقاعدة البيانات
    await connectDB();
    console.log("✅ تم الاتصال بقاعدة البيانات");

    // التحقق مما إذا كان الأدمن موجود بالفعل
    const adminEmail = "osama@gmail.com"; // يمكنك تغيير البريد الإلكتروني
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("⚠️ حساب الأدمن موجود بالفعل:", adminEmail);
      return;
    }

    // تشفير كلمة المرور
    const adminPassword = "osama123"; // استبدل بكلمة مرور قوية
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // إنشاء حساب الأدمن
    const admin = await User.create({
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
  } catch (error: any) {
    console.error("❌ خطأ أثناء إنشاء الأدمن:", error.message);
  } finally {
    // إغلاق الاتصال بقاعدة البيانات
    await mongoose.connection.close();
    console.log("🔌 تم إغلاق الاتصال بقاعدة البيانات");
  }
};

// تشغيل الدالة
createAdmin();
