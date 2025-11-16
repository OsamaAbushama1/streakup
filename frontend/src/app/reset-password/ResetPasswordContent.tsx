"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

type FormData = {
  password: string;
  confirmPassword: string;
};

const ResetPassword: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false); // New loading state
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || !formData.confirmPassword) {
      setError("Both fields are required.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setLoading(true); // Start loading
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="bg-[#F4E5FF] flex flex-col items-center justify-center min-h-screen p-4 relative">
      <h1 className="text-4xl font-bold text-center text-black mb-4">
        Reset Your Password
      </h1>
      <p className="text-center text-[#2E2E38] mb-6 text-lg">
        Enter your new password below.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white space-y-4 w-full max-w-lg p-6 rounded-xl"
      >
        <div>
          <label className="block text-[#2E2E38] text-sm font-bold mb-2">
            New Password
          </label>
          <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
              disabled={loading} // Disable input during loading
            />
          </div>
        </div>
        <div>
          <label className="block text-[#2E2E38] text-sm font-bold mb-2">
            Confirm Password
          </label>
          <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
              disabled={loading} // Disable input during loading
            />
          </div>
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
            "Reset Password →"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Back to{" "}
        <Link href="/login" className="text-[#A333FF] hover:underline">
          Login
        </Link>
      </p>

      {success && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6 flex flex-col items-center max-w-sm w-full">
          <h2 className="text-2xl font-bold text-[#A333FF] mb-4">Success!</h2>
          <p className="text-[#2E2E38] text-center">
            Your password has been successfully reset. You will be redirected to
            the login page shortly.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
