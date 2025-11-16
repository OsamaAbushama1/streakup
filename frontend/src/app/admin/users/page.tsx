"use client";
import React, { useState, useEffect } from "react";
import { FiEdit, FiSearch, FiTrash2, FiX, FiSlash } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  track: string;
  skillLevel: string;
  role: string;
  points: number;
  completedChallenges: number;
  lastLogin?: string;
  createdAt: string;
  banUntil?: string | null;
}

interface FormData {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  track: string;
  skillLevel: string;
  role: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    track: "",
    skillLevel: "Beginner",
    role: "User",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedTrack, setSelectedTrack] = useState("All Tracks");
  const router = useRouter();

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/users`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  // تصفية المستخدمين بناءً على البحث والفلاتر
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          `${user.firstName} ${user.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLevel !== "All Levels") {
      filtered = filtered.filter((user) => user.skillLevel === selectedLevel);
    }

    if (selectedTrack !== "All Tracks") {
      filtered = filtered.filter((user) => user.track === selectedTrack);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, selectedLevel, selectedTrack, users]);

  const openModal = (user: User) => {
    setFormData({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      track: user.track,
      skillLevel: user.skillLevel,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      track: "",
      skillLevel: "Beginner",
      role: "User",
    });
    setError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // تحقق من صيغة الإيميل
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return;
    }
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${formData._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
          credentials: "include",
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }
      setUsers(
        users.map((u) => (u._id === formData._id ? { ...u, ...formData } : u))
      );
      setFilteredUsers(
        filteredUsers.map((u) =>
          u._id === formData._id ? { ...u, ...formData } : u
        )
      );
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`${backendUrl}/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete user");
      }
      setUsers(users.filter((user) => user._id !== userId));
      setFilteredUsers(filteredUsers.filter((user) => user._id !== userId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleBanUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to ban this user for 2 days? Their account will be reset (points, streak, challenges) and related reports will be marked as banned."
      )
    )
      return;
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${userId}/ban`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to ban user");
      }
      await response.json();
      // تحديث بيانات المستخدم لتعكس الحظر وتصفير النقاط والتحديات
      setUsers(
        users.map((user) =>
          user._id === userId
            ? {
                ...user,
                points: 0,
                completedChallenges: 0,
                banUntil: new Date(
                  Date.now() + 2 * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : user
        )
      );
      setFilteredUsers(
        filteredUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                points: 0,
                completedChallenges: 0,
                banUntil: new Date(
                  Date.now() + 2 * 24 * 60 * 60 * 1000
                ).toISOString(),
              }
            : user
        )
      );
      alert(
        "User banned successfully for 2 days. Their account has been reset and related reports marked as banned."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // دالة لتحديد حالة المستخدم (Banned أو Active)
  const getUserStatus = (banUntil?: string | null) => {
    if (banUntil && new Date(banUntil) > new Date()) {
      return "Banned";
    }
    return "Active";
  };

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Users Management
        </h1>
        <p className="text-sm sm:text-base text-[#6b6b6e] mb-6">
          View user performance and engagement at a glance
        </p>

        {/* شريط البحث والفلاتر */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-1/2 max-w-md">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg sm:text-xl cursor-pointer" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-8 py-2 w-40 sm:w-60 md:w-80 border-none rounded-lg focus:outline-none bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm sm:text-base text-black"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full sm:w-40 border-none bg-[#F5F5F7] rounded-lg px-4 py-2 text-sm font-bold text-black focus:outline-none"
            >
              <option value="All Levels">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="w-full sm:w-40 border-none bg-[#F5F5F7] rounded-lg px-4 py-2 text-sm font-bold text-black focus:outline-none"
            >
              <option value="All Tracks">All Tracks</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Frontend Development">Frontend Development</option>
              <option value="Backend Development">Backend Development</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F5F5F7] text-[#2E2E38]">
              <tr>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Name
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Email
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Track
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Level
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Completed
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Points
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Last Login
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Join Time
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Status
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className="border-b hover:bg-[#F9F9F9]">
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.track}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.skillLevel}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.completedChallenges}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.points ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {new Date(user.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm">
                    <span
                      className={
                        getUserStatus(user.banUntil) === "Banned"
                          ? "text-orange-500 font-semibold"
                          : "text-green-500 font-semibold"
                      }
                    >
                      {getUserStatus(user.banUntil)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openModal(user)}
                        className="text-[#A333FF] hover:text-[#9225e5]"
                        title="Edit User"
                      >
                        <FiEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete User"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      <button
                        onClick={() => handleBanUser(user._id)}
                        className="text-orange-500 hover:text-orange-700"
                        title="Ban User"
                      >
                        <FiSlash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md sm:max-w-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#2E2E38]">
              Edit User
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-[#2E2E38]">
                  First Name
                </label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none text-black"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[#2E2E38]">
                  Last Name
                </label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none text-black"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[#2E2E38]">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none text-black"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[#2E2E38]">
                  Track
                </label>
                <select
                  name="track"
                  value={formData.track}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none text-black"
                  required
                >
                  <option value="">Select Track</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Frontend Development">
                    Frontend Development
                  </option>
                  <option value="Backend Development">
                    Backend Development
                  </option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[#2E2E38]">
                  Skill Level
                </label>
                <select
                  name="skillLevel"
                  value={formData.skillLevel}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none text-black"
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-[#2E2E38]">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none text-black"
                  required
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="bg-[#A333FF] text-white py-2 px-4 rounded-lg text-sm hover:bg-[#9225e5] transition w-full sm:w-auto"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white text-[#A333FF] border border-[#A333FF] py-2 px-4 rounded-lg text-sm hover:bg-[#A333FF] hover:text-white transition w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
