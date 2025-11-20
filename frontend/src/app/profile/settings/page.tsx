"use client";
import HomeHeader from "@/app/components/Home/HomeHeader";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { API_BASE_URL } from "@/config/api";
import { Skeleton, SkeletonCard } from "@/app/components/Skeleton";

const SettingsPage: React.FC = () => {
  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Other settings
  const [emailNotification, setEmailNotification] = useState(true);
  const [challengeReminder, setChallengeReminder] = useState(true);
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Eastern Time (ET)");
  const [loading, setLoading] = useState(true); // حالة التحميل الأولي
  const [error, setError] = useState<string | null>(null); // حالة الخطأ

  const router = useRouter();

  // جلب إعدادات المستخدم عند تحميل الصفحة
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user settings");
        }

        const data = await res.json();
        // افتراض أن الخادم يُرجع إعدادات المستخدم (يمكن تعديلها حسب API)
        setEmailNotification(data.user.emailNotification ?? true);
        setChallengeReminder(data.user.challengeReminder ?? true);
        setLanguage(data.user.language ?? "English");
        setTimezone(data.user.timezone ?? "Eastern Time (ET)");
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
        if (error instanceof Error && error.message.includes("401")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
  }, [router]);

  // Change password only (API call)
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true); // تفعيل التحميل أثناء تغيير كلمة المرور
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      alert("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // عرض Skeleton أثناء التحميل الأولي
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <HomeHeader />
        <div className="container mx-auto px-4 py-10 xl:max-w-7xl">
          <Skeleton variant="text" width="30%" height={32} className="mb-6" />
          <Skeleton variant="rectangular" width="100%" height={200} className="rounded-xl mb-6" />
          <Skeleton variant="rectangular" width="100%" height={200} className="rounded-xl mb-6" />
          <Skeleton variant="rectangular" width="100%" height={200} className="rounded-xl" />
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ إذا وجدت
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white">
      <HomeHeader />
      <div className="container mx-auto max-w-full px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-8 md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <FiArrowLeft
            className="text-xl cursor-pointer text-black"
            onClick={() => router.back()}
          />
          <h1 className="text-3xl font-bold text-black">Settings</h1>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-black">
            Account Security
          </h2>
          <label className="block text-sm mb-1 text-[#2E2E38]">
            Change Password
          </label>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#A333FF] text-[#423f40]"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#A333FF] text-[#423f40]"
            disabled={loading}
          />
          <button
            onClick={handleChangePassword}
            className="bg-[#A333FF] text-white w-full py-2 rounded-lg hover:bg-[#9225e5] transition disabled:bg-[#A333FF]/50"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-black">
            Notifications & Reminders
          </h2>

          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
            <div>
              <p className="font-normal text-[#2E2E38]">E-mail Notification</p>
              <p className="text-sm text-[#999395]">
                Receive notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotification}
                onChange={() => setEmailNotification(!emailNotification)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#A333FF] rounded-full peer peer-checked:bg-[#A333FF] transition-all"></div>
              <div className="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white rounded-full peer-checked:translate-x-full transition-all"></div>
            </label>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-normal text-black">Challenge Reminder</p>
              <p className="text-sm text-[#999395]">
                Get reminders about active challenges
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={challengeReminder}
                onChange={() => setChallengeReminder(!challengeReminder)}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#A333FF] rounded-full peer peer-checked:bg-[#A333FF] transition-all"></div>
              <div className="absolute left-[3px] top-[3px] w-[18px] h-[18px] bg-white rounded-full peer-checked:translate-x-full transition-all"></div>
            </label>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-black">Preferences</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-[#423f40]">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#A333FF] text-[#999395]"
              disabled={loading}
            >
              <option>English</option>
              <option>Arabic</option>
              <option>French</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-[#423f40]">
              Time Zone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#A333FF] text-[#999395]"
              disabled={loading}
            >
              <option>Eastern Time (ET)</option>
              <option>Central European Time (CET)</option>
              <option>Gulf Standard Time (GST)</option>
            </select>
          </div>
        </div>

        <button
          className="w-full py-2 border border-[#A333FF] text-[#A333FF] rounded-lg hover:bg-[#A333FF] hover:text-white transition"
          onClick={() => router.push("/login")}
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
