"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import {
  FiUsers,
  FiClipboard,
  FiFileText,
  FiActivity,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiLogOut,
} from "react-icons/fi";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const backendUrl = API_BASE_URL;

  const handleLogout = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      // Force navigation and clear cache
      window.location.href = "/login";
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Logout error:", error.message);
      } else {
        console.error("Logout error:", error);
      }
      // Navigate to login even on error
      window.location.href = "/login";
    }
  };

  return (
    <div
      className={`bg-white h-screen p-4 pt-6 fixed transition-all duration-300 flex flex-col ${isOpen ? "w-54" : "w-16"
        } shadow-md`}
    >
      <div className="flex items-center justify-between mb-10">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Image
              src="/imgs/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-black">Streak Up</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-[#A333FF] hover:text-[#7B22CC] focus:outline-none"
          suppressHydrationWarning
        >
          {isOpen ? <FiChevronLeft size={24} /> : <FiChevronRight size={24} />}
        </button>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              href="/admin"
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${pathname === "/admin"
                  ? "bg-[#F4E5FF] text-[#A333FF] font-bold"
                  : "text-[#939398] hover:bg-[#F4E5FF] hover:text-[#A333FF]"
                }`}
            >
              <FiHome size={20} />
              {isOpen && "Dashboard"}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/challenges"
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${pathname === "/admin/challenges"
                  ? "bg-[#F4E5FF] text-[#A333FF] font-bold"
                  : "text-[#939398] hover:bg-[#F4E5FF] hover:text-[#A333FF]"
                }`}
            >
              <FiClipboard size={20} />
              {isOpen && "Challenges"}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/users"
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${pathname === "/admin/users"
                  ? "bg-[#F4E5FF] text-[#A333FF] font-bold"
                  : "text-[#939398] hover:bg-[#F4E5FF] hover:text-[#A333FF]"
                }`}
            >
              <FiUsers size={20} />
              {isOpen && "Users"}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/reports"
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${pathname === "/admin/reports"
                  ? "bg-[#F4E5FF] text-[#A333FF] font-bold"
                  : "text-[#939398] hover:bg-[#F4E5FF] hover:text-[#A333FF]"
                }`}
            >
              <FiFileText size={20} />
              {isOpen && "Reports"}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/activity"
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${pathname === "/admin/activity"
                  ? "bg-[#F4E5FF] text-[#A333FF] font-bold"
                  : "text-[#939398] hover:bg-[#F4E5FF] hover:text-[#A333FF]"
                }`}
            >
              <FiActivity size={20} />
              {isOpen && "Activity"}
            </Link>
          </li>
          <li>
            <Link
              href="/admin/settings"
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${pathname === "/admin/settings"
                  ? "bg-[#F4E5FF] text-[#A333FF] font-bold"
                  : "text-[#939398] hover:bg-[#F4E5FF] hover:text-[#A333FF]"
                }`}
            >
              <FiSettings size={20} />
              {isOpen && "Settings"}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 p-2 rounded-lg text-sm w-full text-left ${pathname === "/logout"
              ? "bg-[#A333FF] text-[#F4E5FF] font-bold"
              : "text-[#F4E5FF] hover:bg-[#8022cd] hover:text-[#F4E5FF] bg-[#A333FF]"
            }`}
          suppressHydrationWarning
        >
          <FiLogOut size={20} />
          {isOpen && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
