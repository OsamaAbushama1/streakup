"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { Skeleton } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";
import { Metadata } from "../components/Metadata/Metadata";

type FormData = {
  email: string;
  password: string;
};

// دالة مساعدة لجلب الـ token
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

// دالة مساعدة لجلب الـ headers الصحيحة
// بدل الدالة القديمة، استخدم دي:
const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};
const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();

  // فحص التوثيق عند التحميل
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          // نترك credentials: "include" كـ fallback للويب
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === "Admin") {
            router.push("/admin");
          } else {
            router.push("/home");
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        // لو فشل، نكمل عادي (ممكن التوكن منتهي)
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    handleButtonClick(async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include", // مهم للويب (الكوكي)
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Login failed");
          return;
        }

        // نجاح اللوجن!
        console.log("Login successful:", data);

        // 1. نخزن التوكن في localStorage (للموبايل)
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }

        // 2. نجيب بيانات المستخدم مع التوكن الجديد
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "include", // fallback للويب
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.user?.role === "Admin") {
            router.push("/admin");
          } else {
            router.push("/home");
          }
        } else {
          // لو فشل جلب البروفايل، نروح للـ home عادي
          router.push("/home");
        }
      } catch (err) {
        console.error("Login error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F4E5FF] flex items-center justify-center">
        <div className="bg-white space-y-4 w-full max-w-lg p-6 rounded-xl">
          <Skeleton variant="text" width="60%" height={32} className="mx-auto mb-4" />
          <Skeleton variant="rectangular" width="100%" height={48} className="mb-2" />
          <Skeleton variant="rectangular" width="100%" height={48} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={48} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Metadata title="Login" description="Sign in to your StreakUp account and continue your creative journey" keywords="login, sign in, StreakUp account" />
      <div className="bg-[#F4E5FF] flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold text-center text-black mb-4">
          Welcome Back
        </h1>
        <p className="text-center text-[#2E2E38] mb-6 text-lg">
          Continue your creative journey and pick up where you left off
        </p>

        <form onSubmit={handleSubmit} className="bg-white space-y-4 w-full max-w-lg p-6 rounded-xl">
          <div>
            <label className="block text-[#2E2E38] text-sm font-bold mb-2">
              Email Address
            </label>
            <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Your E-mail"
                className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-[#2E2E38] text-sm font-bold mb-2">
              Password
            </label>
            <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter Your Password"
                className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                disabled={loading}
              />
            </div>
          </div>

          <div className="text-right">
            <Link href="/forget-password" className="text-[#A333FF] text-sm hover:underline">
              Forget Password?
            </Link>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#A333FF] text-white py-3 rounded-lg hover:bg-[#8E4BA3] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || isButtonDisabled}
          >
            {loading || isButtonDisabled ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Login →"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#A333FF] hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </>
  );
};

export default Login;