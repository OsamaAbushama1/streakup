"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

const LandingHeader: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setIsAuthenticated(false);
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header className="py-4 absolute top-4 sm:top-6 left-0 right-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-7xl flex justify-between items-center">
        <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full">
          <Image
            src="/imgs/streakupLogo.png"
            alt="Logo"
            width={45}
            height={45}
            className="object-contain w-full h-full"
          />
        </div>

        <div>
          {loading ? (
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base bg-white/50 text-purple-600 rounded-full font-medium shadow hover:bg-white/80 transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/signup"
              className="px-3 py-1.5 sm:px-5 sm:py-2 text-sm sm:text-base bg-white/50 text-purple-600 rounded-full font-medium shadow hover:bg-white/80 transition"
            >
              Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
