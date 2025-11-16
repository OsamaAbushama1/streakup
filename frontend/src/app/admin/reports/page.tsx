"use client";
import React, { useState, useEffect } from "react";
import { FiSearch, FiTrash2, FiCheck, FiSlash } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

interface Report {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  sharedChallenge: {
    _id: string;
    username: string; // أضف هذا
    challengeId: string;
  } | null;
  content: string;
  createdAt: string;
  reports: string[];
  status: "pending" | "resolved" | "banned";
  deletedAt: string | null;
}

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const router = useRouter();

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/reports`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch reports");
        }
        const data = await response.json();
        const sanitizedReports = data.reports.map((report: Report) => ({
          ...report,
          reports: Array.isArray(report.reports)
            ? report.reports.filter(
                (email) => typeof email === "string" && email.includes("@")
              )
            : [],
        }));
        setReports(sanitizedReports);
        setFilteredReports(sanitizedReports);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchReports();
  }, [router]);

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          `${report.user.firstName} ${report.user.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.reports.some((email) =>
            email.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter(
        (report) => report.status === selectedStatus.toLowerCase()
      );
    }

    setFilteredReports(filtered);
  }, [searchTerm, selectedStatus, reports]);

  const handleResolve = async (commentId: string) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/reports/${commentId}/resolve`,
        {
          method: "PUT",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to resolve report");
      setReports(
        reports.map((r) =>
          r._id === commentId ? { ...r, status: "resolved" } : r
        )
      );
      setFilteredReports(
        filteredReports.map((r) =>
          r._id === commentId ? { ...r, status: "resolved" } : r
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/comments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to delete comment");
      setReports(
        reports.map((r) =>
          r._id === commentId
            ? { ...r, deletedAt: new Date().toISOString(), status: "resolved" }
            : r
        )
      );
      setFilteredReports(
        filteredReports.map((r) =>
          r._id === commentId
            ? { ...r, deletedAt: new Date().toISOString(), status: "resolved" }
            : r
        )
      );
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
      if (!response.ok) throw new Error("Failed to ban user");
      setReports(
        reports.map((r) =>
          r.user._id === userId && r.status === "pending"
            ? { ...r, status: "banned" }
            : r
        )
      );
      setFilteredReports(
        filteredReports.map((r) =>
          r.user._id === userId && r.status === "pending"
            ? { ...r, status: "banned" }
            : r
        )
      );
      alert(
        "User banned successfully for 2 days. Their account has been reset and related reports marked as banned."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };
  const handleRowClick = (report: Report) => {
    const { sharedChallenge, _id: commentId } = report;

    if (!sharedChallenge?.challengeId || !sharedChallenge.username) {
      alert("Invalid shared challenge or username");
      return;
    }

    const username = sharedChallenge.username;
    const challengeId = sharedChallenge.challengeId;

    // احفظ commentId في localStorage
    localStorage.setItem("scrollToComment", commentId);

    // انتقل للـ URL النظيف
    router.push(`/${username}/${challengeId}`);
  };

  if (loading) return <p className="text-center text-lg">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Reports & Feedback
        </h1>
        <p className="text-sm sm:text-base text-[#6b6b6e] mb-6">
          Review flagged content and user-reported issues
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-1/2 max-w-md">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg sm:text-xl cursor-pointer" />
            <input
              type="text"
              placeholder="Search by name, email, or reporter email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-8 py-2 w-full border-none rounded-lg focus:outline-none bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm sm:text-base text-black"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-40 border-none bg-[#F5F5F7] rounded-lg px-4 py-2 text-sm font-bold text-black focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Banned">Banned</option>
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
                  Comment Content
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Date
                </th>
                <th className="px-4 py-3 text-xs sm:text-sm text-black font-bold">
                  Reporter Emails
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
              {filteredReports.map((report) => (
                <tr
                  key={report._id}
                  className="border-b hover:bg-[#F9F9F9] cursor-pointer"
                  onClick={() => handleRowClick(report)}
                >
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {report.user.firstName} {report.user.lastName}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {report.user.email}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {report.content}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {new Date(report.createdAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {report.reports.length > 0
                      ? report.reports.slice(0, 3).join(", ") +
                        (report.reports.length > 3 ? "..." : "")
                      : "No reporters"}
                  </td>
                  <td className="px-4 py-3 text-xs sm:text-sm text-black">
                    {report.status.charAt(0).toUpperCase() +
                      report.status.slice(1)}
                  </td>
                  <td
                    className="px-4 py-3 text-xs sm:text-sm text-black"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2 justify-center">
                      {report.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleResolve(report._id)}
                            className="text-green-500 hover:text-green-700"
                            title="Resolve"
                          >
                            <FiCheck size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(report._id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Comment"
                          >
                            <FiTrash2 size={16} />
                          </button>
                          <button
                            onClick={() => handleBanUser(report.user._id)}
                            className="text-orange-500 hover:text-orange-700"
                            title="Ban User"
                          >
                            <FiSlash size={16} />
                          </button>
                        </>
                      )}
                      {report.status === "banned" && (
                        <button
                          onClick={() => handleDeleteComment(report._id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete Comment"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
