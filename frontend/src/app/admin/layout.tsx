"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import HeaderAdmin from "./HeaderAdmin/HeaderAdmin";
import { API_BASE_URL } from "@/config/api";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Check admin permissions
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Unauthorized");
        const data = await response.json();
        if (data.user.role !== "Admin" && data.user.role !== "SuperAdmin") {
          router.push("/login");
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        router.push("/login");
      }
    };
    checkAdmin();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        {/* Header */}
        <HeaderAdmin isSidebarOpen={isSidebarOpen} />
        {/* Content */}
        <main className="pt-20">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
