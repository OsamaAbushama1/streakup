"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiSearch } from "react-icons/fi";
import { API_BASE_URL } from "@/config/api";

const HeaderAdmin: React.FC<{ isSidebarOpen: boolean }> = ({
  isSidebarOpen,
}) => {
  const [adminName, setAdminName] = useState("Admin Name");
  const [adminEmail, setAdminEmail] = useState("admin@example.com");
  const router = useRouter();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch admin profile");
        }
        const data = await response.json();
        const { firstName, lastName, email } = data.user;
        setAdminName(`${firstName} ${lastName}`.trim());
        setAdminEmail(email);
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    };

    fetchAdminProfile();
  }, [router]);

  return (
    <header
      className={`fixed top-0 bg-white h-20 flex items-center justify-between px-6 transition-all duration-300 shadow-md z-10 ${
        isSidebarOpen
          ? "left-64 w-[calc(100%-16rem)]"
          : "left-16 w-[calc(100%-4rem)]"
      }`}
    >
      {/* Search Bar */}
      <div className="flex items-center w-1/2">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg sm:text-xl cursor-pointer" />
          <input
            type="text"
            placeholder="Search Challenge, Creative..."
            className="px-8 py-2 w-40 sm:w-60 md:w-80 border-none rounded-lg focus:outline-none bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm sm:text-base text-black"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="bg-[#F5F5F7] rounded-full p-2 flex items-center justify-center">
          <FiUser className="text-black" size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-black font-semibold">{adminName}</span>
          <span className="text-sm text-[#B0B0B8]">{adminEmail}</span>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdmin;
