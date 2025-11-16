"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";

type FormData = {
  email: string;
  password: string;
};

const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false); // New loading state
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          // إعادة التوجيه بناءً على الدور
          if (data.user.role === "Admin") {
            router.push("/admin");
          } else {
            router.push("/home");
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
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

    setLoading(true); // Start loading
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
      } else {
        console.log("Logged in user:", data);
        // جلب بيانات المستخدم للتحقق من الدور
        const profileRes = await fetch(
          `${API_BASE_URL}/api/auth/profile`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.user.role === "Admin") {
            router.push("/admin");
          } else {
            router.push("/home");
          }
        } else {
          setError("Failed to fetch user profile");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F4E5FF] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A333FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4E5FF] flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold text-center text-black mb-4">
        Welcome Back
      </h1>
      <p className="text-center text-[#2E2E38] mb-6 text-lg">
        Continue your creative journey and pick up where you left off
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white space-y-4 w-full max-w-lg p-6 rounded-xl"
      >
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
              disabled={loading} // Disable input during loading
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
              disabled={loading} // Disable input during loading
            />
          </div>
        </div>
        <div className="text-right">
          <Link
            href="/forget-password"
            className="text-[#A333FF] text-sm hover:underline"
          >
            Forget Password?
          </Link>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#A333FF] text-white py-3 rounded-lg hover:bg-[#8E4BA3] transition-colors flex items-center justify-center"
          disabled={loading} // Disable button during loading
        >
          {loading ? (
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
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#A333FF] hover:underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
};

export default Login;
