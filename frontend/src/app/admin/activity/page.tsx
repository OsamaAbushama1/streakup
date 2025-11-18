"use client";
import React, { useState, useEffect } from "react";
import { FiX, FiSearch, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { Skeleton, SkeletonCard } from "../../components/Skeleton";
import { Metadata } from "../../components/Metadata/Metadata";

interface Activity {
  _id: string;
  userName: string;
  email: string;
  activityType: "Comment" | "Share" | "Like";
  activityDetails: string;
  activityId: string;
  relatedId: string;
  createdAt: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const ActivityManagement: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const router = useRouter();

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/activities`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch activities");
        }
        const data = await response.json();
        setActivities(data.activities);
        setFilteredActivities(data.activities);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchActivities();
  }, [router]);

  // تصفية الأنشطة بناءً على البحث ونوع النشاط
  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.activityDetails
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== "All Types") {
      filtered = filtered.filter(
        (activity) => activity.activityType === selectedType
      );
    }

    setFilteredActivities(filtered);
  }, [searchTerm, selectedType, activities]);

  const handleDelete = async (activity: Activity) => {
    if (
      !confirm(`Are you sure you want to delete this ${activity.activityType}?`)
    )
      return;
    try {
      let url = "";
      if (activity.activityType === "Comment") {
        url = `${backendUrl}/api/admin/comments/${activity.activityId}`;
      } else if (activity.activityType === "Share") {
        url = `${backendUrl}/api/admin/shared-challenges/${activity.activityId}`;
      } else {
        return; // الإعجابات لا يمكن حذفها مباشرة
      }

      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`Failed to delete ${activity.activityType}`);
      setActivities(activities.filter((a) => a._id !== activity._id));
      setFilteredActivities(
        filteredActivities.filter((a) => a._id !== activity._id)
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleBanUser = async (email: string) => {
    if (!confirm("Are you sure you want to ban this user?")) return;
    try {
      const userResponse = await fetch(`${backendUrl}/api/admin/users`, {
        credentials: "include",
      });
      if (!userResponse.ok) throw new Error("Failed to fetch users");
      const data = await userResponse.json();
      const user = data.users.find((u: User) => u.email === email);
      if (!user) throw new Error("User not found");

      const response = await fetch(
        `${backendUrl}/api/admin/users/${user._id}/ban`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to ban user");
      alert("User banned successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading)
    return (
      <>
        <Metadata title="Activity Management" description="Review recent user activities" />
        <div className="min-h-screen bg-white">
          <div className="w-full px-4 py-6">
            <Skeleton variant="text" width="40%" height={32} className="mb-2" />
            <Skeleton variant="text" width="60%" height={20} className="mb-6" />
            <Skeleton variant="rectangular" width="100%" height={400} className="rounded-xl" />
          </div>
        </div>
      </>
    );
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <>
      <Metadata title="Activity Management" description="Review recent user activities (Comments, Shares, Likes)" />
      <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Activity Management
        </h1>
        <p className="text-sm sm:text-base text-[#6b6b6e] mb-6">
          Review recent user activities (Comments, Shares, Likes)
        </p>

        {/* شريط البحث والفلتر */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-1/2 max-w-md">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg sm:text-xl cursor-pointer" />
            <input
              type="text"
              placeholder="Search by name, email, or activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 md:w-80 pl-8 pr-4 py-2 border-none rounded-lg bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm focus:outline-none text-black"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-40 border-none bg-[#F5F5F7] rounded-lg px-4 py-2 text-sm font-bold text-black focus:outline-none"
            >
              <option value="All Types">All Types</option>
              <option value="Comment">Comment</option>
              <option value="Share">Share</option>
              <option value="Like">Like</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F5F5F7] text-[#2E2E38]">
              <tr>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  User Name
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Email
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Time
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Activity
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity) => (
                <tr key={activity._id} className="border-b hover:bg-[#F9F9F9]">
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {activity.userName}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {activity.email}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {new Date(activity.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {activity.activityType}: {activity.activityDetails}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    <div className="flex gap-2">
                      {activity.activityType !== "Like" && (
                        <button
                          onClick={() => handleDelete(activity)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleBanUser(activity.email)}
                        className="text-yellow-500 hover:text-yellow-700"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default ActivityManagement;
