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

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
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

    handleButtonClick(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
          credentials: "include",
        });

        let data;
        const contentType = res.headers.get("content-type");

        if (res.status === 429) {
          try {
            data = await res.json();
            setError(data?.message || "Too many authentication attempts. Please wait 15 minutes before trying again.");
          } catch {
            const text = await res.text();
            setError(text || "Too many authentication attempts. Please wait 15 minutes before trying again.");
          }
          return;
        }

        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || "Server error");
        }

        if (!res.ok) {
          setError(data?.message || "Login failed");
        } else {
          console.log("Logged in user:", data);
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
        setLoading(false);
      }
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
      <div className="min-h-screen bg-white flex">
        {/* Left Side - Video */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/vid/HeroSct.mp4" type="video/mp4" />
          </video>
          {/* Optional overlay for better aesthetics */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent"></div>
        </div>

        {/* Right Side - Login Form Card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Continue your creative journey and pick up where you left off
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 shadow-xl space-y-6 w-full p-6 sm:p-8 rounded-2xl"
            >
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <div className="p-[2px] rounded-lg bg-gray-300 focus-within:bg-[linear-gradient(to_right,#8981FA,#A333FF)] transition">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Your E-mail"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none bg-white text-black placeholder-gray-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Password
                </label>
                <div className="p-[2px] rounded-lg bg-gray-300 focus-within:bg-[linear-gradient(to_right,#8981FA,#A333FF)] transition">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter Your Password"
                    className="w-full px-4 py-3 rounded-lg focus:outline-none bg-white text-black placeholder-gray-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="text-right">
                <Link
                  href="/forget-password"
                  className="text-[#8981FA] text-sm font-medium hover:underline"
                >
                  Forget Password?
                </Link>
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

              <button
                type="submit"
                className="w-full bg-[#8981FA] text-white py-3 rounded-lg font-semibold hover:bg-[#725BF3] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

              <p className="text-center text-sm text-gray-600 pt-4">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#8981FA] font-semibold hover:underline">
                  Sign up here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
