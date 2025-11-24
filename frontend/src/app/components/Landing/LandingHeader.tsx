"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { motion } from "framer-motion";

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
        // Force navigation and clear cache
        window.location.href = "/login";
      } else {
        console.error("Logout failed:", res.statusText);
        // Still try to navigate even if request fails
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Navigate to login even on error
      window.location.href = "/login";
    }
  };

  return (
    <motion.header
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="py-4 absolute top-4 sm:top-6 left-0 right-0 z-10"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-7xl flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center"
        >
          <Link href="/" className="block">
            <Image
              src="/imgs/logo.png"
              alt="Logo"
              width={70}
              height={70}
              priority
              className="
        object-contain
        w-11 h-11
        sm:w-12 sm:h-12
        md:w-[45px] md:h-[45px]
        lg:w-[55px] lg:h-[55px]
        cursor-pointer
      "
            />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {isAuthenticated ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-3 py-1.5 sm:px-5 sm:py-3 text-sm sm:text-base bg-white/50 text-purple-600 rounded-full font-medium shadow hover:bg-white/80 transition"
            >
              Logout
            </motion.button>
          ) : (
            <>
              {/* Sign Up Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="inline-block"
              >
                <Link
                  href="/signup"
                  className="px-5 py-2.5 sm:px-5 sm:py-4 text-sm sm:text-base bg-[#8981FA] text-white rounded-full font-semibold shadow-lg hover:bg-[#9330e4] transition whitespace-nowrap mr-2 inline-block"
                >
                  Sign Up
                </Link>
              </motion.div>
              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="inline-block"
              >
                <Link
                  href="/login"
                  className="px-5 py-2.5 sm:px-5 sm:py-4 text-sm sm:text-base text-[#ffffff] border border-white/70 rounded-full font-semibold 
                     bg-white/10 backdrop-blur-sm
                     shadow-md 
                     hover:bg-white/20 hover:shadow-lg  
                     transition-all duration-300 whitespace-nowrap inline-block"
                >
                  Login
                </Link>
              </motion.div>
            </>

          )}
        </motion.div>
      </div>
    </motion.header>
  );
};

export default LandingHeader;
