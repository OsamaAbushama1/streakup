"use client";
import React, { useState, useEffect } from "react";
import { FiLogOut, FiPlus, FiX, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Track {
  name: string;
  isFixed: boolean;
  icon?: string; // حقل جديد لمسار الأيقونة
  description?: string;
}

const Settings: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Admin",
    track: "Frontend Development",
  });
  const [newAdminImage, setNewAdminImage] = useState<File | null>(null);
  const [newTrack, setNewTrack] = useState("");
  const [newTrackIcon, setNewTrackIcon] = useState<File | null>(null); // حالة لصورة الأيقونة
  const [tracks, setTracks] = useState<Track[]>([
    { name: "UI/UX Design", isFixed: true },
    { name: "Graphic Design", isFixed: true },
    { name: "Frontend Development", isFixed: true },
  ]);
  const [newTrackDescription, setNewTrackDescription] = useState("");
  const router = useRouter();

  const backendUrl = API_BASE_URL;

  // جلب بيانات الـ Admin والـ Tracks
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/profile`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch admin data");
        }
        const data = await response.json();
        setAdmin(data.user);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    const fetchTracks = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/tracks`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch tracks");
        const data = await response.json();
        setTracks([
          { name: "UI/UX Design", isFixed: true },
          { name: "Graphic Design", isFixed: true },
          { name: "Frontend Development", isFixed: true },
          ...data.tracks.map((track: { name: string; icon?: string }) => ({
            name: track.name,
            isFixed: false,
            icon: track.icon,
          })),
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchAdminData();
    fetchTracks();
  }, [router]);

  // إضافة Track جديد مع صورة
  const handleAddTrack = async () => {
    if (!newTrack.trim()) {
      setError("Track name is required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", newTrack);
      formData.append("description", newTrackDescription); // أضف الوصف
      if (newTrackIcon) {
        formData.append("icon", newTrackIcon);
      }
      const response = await fetch(`${backendUrl}/api/admin/tracks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add track");
      }
      const data = await response.json();
      setTracks([
        ...tracks,
        {
          name: newTrack,
          isFixed: false,
          icon: data.track.icon,
          description: data.track.description || undefined,
        },
      ]);
      setNewTrack("");
      setNewTrackDescription("");
      setNewTrackIcon(null);
      setError(null);
      alert("Track added successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // حذف Track
  const handleDeleteTrack = async (trackName: string) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/tracks/${trackName}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to delete track");
      setTracks(tracks.filter((track) => track.name !== trackName));
      setError(null);
      alert("Track deleted successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // باقي الدوال بدون تغيير
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) throw new Error("Failed to change password");
      alert("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newAdmin.firstName ||
      !newAdmin.lastName ||
      !newAdmin.email ||
      !newAdmin.password ||
      !newAdmin.track
    ) {
      setError("All fields except image are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.email)) {
      setError("Invalid email format");
      return;
    }
    if (newAdmin.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("firstName", newAdmin.firstName);
      formData.append("lastName", newAdmin.lastName);
      formData.append("email", newAdmin.email);
      formData.append("password", newAdmin.password);
      formData.append("role", newAdmin.role);
      formData.append("track", newAdmin.track);
      if (newAdminImage) formData.append("profilePicture", newAdminImage);

      const response = await fetch(`${backendUrl}/api/admin/register`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add admin");
      }
      alert("Admin added successfully");
      setIsModalOpen(false);
      setNewAdmin({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Admin",
        track: "Frontend Development",
      });
      setNewAdminImage(null);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to logout");
      // Force navigation and clear cache
      window.location.href = "/login";
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      // Navigate to login even on error
      window.location.href = "/login";
    }
  };

  const handleSave = async () => {
    alert("Settings saved successfully");
  };

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-[#6b6b6e] mb-6">
          Manage your admin preferences and account settings
        </p>

        {/* Password Change Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 mb-1 px-4 py-3 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
              placeholder="Enter new password"
            />
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 px-4 py-3 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
              placeholder="Confirm new password"
            />
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Tracks Management Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">Manage Tracks</h2>
          <p className="text-sm text-[#8e8e91] mb-4">
            Add or remove tracks for challenges and user profiles
          </p>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={newTrack}
                onChange={(e) => setNewTrack(e.target.value)}
                className="px-4 py-3 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                placeholder="Enter new track name"
              />
              <input
                type="text"
                value={newTrackDescription}
                onChange={(e) => setNewTrackDescription(e.target.value)}
                className="px-4 py-3 w-full border-none rounded-lg bg-[#F5F5F7] text-sm text-black"
                placeholder="Enter track description (optional)"
                maxLength={150}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewTrackIcon(e.target.files ? e.target.files[0] : null)
                }
                className="px-4 py-3 w-full border-none rounded-lg bg-[#F5F5F7] text-sm text-black"
              />
              <button
                onClick={handleAddTrack}
                className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition flex items-center gap-2"
              >
                <FiPlus size={16} />
                Add Track
              </button>
            </div>
            <h3 className="text-sm font-medium text-black mb-2">
              Current Tracks
            </h3>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.name}
                  className="flex items-center justify-between bg-[#F5F5F7] p-3 rounded-lg"
                >
                  <span className="text-sm text-black">{track.name}</span>
                  {!track.isFixed && (
                    <button
                      onClick={() => handleDeleteTrack(track.name)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Roles Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-2">Admin Roles</h2>
          <p className="text-sm text-[#8e8e91] mb-4">
            Manage administrator permissions
          </p>
          <p className="text-sm font-medium text-black mb-2">
            Your role: {admin?.role || "Loading..."}
          </p>
          <p className="text-sm text-[#8e8e91] mb-4">
            You have full access to all platform features and settings
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition flex items-center gap-2"
          >
            <FiPlus size={16} />
            Add Admin
          </button>
        </div>

        {/* Save and Logout Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition"
          >
            Save
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white text-[#A333FF] border border-[#A333FF] rounded-lg hover:bg-[#A333FF] hover:text-white transition-all flex items-center gap-2"
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>

        {/* Add Admin Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">Add New Admin</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={newAdmin.firstName}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, firstName: e.target.value })
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={newAdmin.lastName}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, lastName: e.target.value })
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newAdmin.email}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, email: e.target.value })
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={newAdmin.password}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, password: e.target.value })
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, role: e.target.value })
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                  >
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="track"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Track
                  </label>
                  <select
                    id="track"
                    value={newAdmin.track}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, track: e.target.value })
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                  >
                    {tracks.map((track) => (
                      <option key={track.name} value={track.name}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="image"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Profile Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={(e) =>
                      setNewAdminImage(
                        e.target.files ? e.target.files[0] : null
                      )
                    }
                    className="mt-1 px-4 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] text-sm text-black"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
