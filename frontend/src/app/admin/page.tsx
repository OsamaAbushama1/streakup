"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Align,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  FiArrowUp,
  FiArrowDown,
  FiUsers,
  FiMessageSquare,
  FiHeart,
  FiFlag,
} from "react-icons/fi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DashboardStats {
  totalUsers: number;
  usersChange: number;
  totalComments: number;
  commentsChange: number;
  totalLikes: number;
  likesChange: number;
  totalReports: number;
  reportsChange: number;
  activeUsers: number;
  tracksDistribution: { track: string; count: number }[];
  levelsDistribution: { level: string; count: number }[];
  newUserSignups: { month: string; count: number }[];
  top10Creatives: { name: string; streak: number; points: number }[];
  availableYears: number[];
  monthName: string;
}

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | number>("all");
  const router = useRouter();
  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const yearParam = selectedYear === "all" ? "all" : selectedYear;
        const url = `${backendUrl}/api/admin?year=${yearParam}`;
        console.log("Fetching stats from:", url); // Debugging
        const response = await fetch(url, {
          credentials: "include",
        });
        console.log("Response status:", response.status); // Debugging
        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
            console.error("Unauthorized or Forbidden:", await response.text());
            router.push("/login");
            return;
          }
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch dashboard stats"
          );
        }
        const data = await response.json();
        console.log("Stats data:", data); // Debugging
        setStats(data);
        setLoading(false);
      } catch (err: unknown) {
        console.error("Fetch stats error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchStats();
    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`${backendUrl}/api/auth/heartbeat`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.warn("Heartbeat failed (user may be logged out)", err);
      }
    }, 2 * 60 * 1000); // كل 2 دقيقة
    const statsInterval = setInterval(fetchStats, 5 * 60 * 1000);
    // تنظيف عند إغلاق الصفحة
    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(statsInterval);
    };
  }, [router, selectedYear, backendUrl]);

  // Rest of the component remains unchanged (charts, UI, etc.)
  const prepareSignupsData = (
    signups: { month: string; count: number }[],
    year: string | number,
    currentDate: Date,
    availableYears: number[]
  ) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const yearColors = [
      "#A333FF",
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#FFD700",
    ];

    if (year === "all") {
      let allLabels: string[] = [];
      availableYears.forEach((y) => {
        const isCurrentYear = y === currentDate.getFullYear();
        const maxMonth = isCurrentYear ? currentDate.getMonth() + 1 : 12;
        const yearLabels = months
          .slice(0, maxMonth)
          .map((month) => `${month} ${y}`);
        allLabels = allLabels.concat(yearLabels);
      });

      const datasets = availableYears.map((y, index) => {
        const data = allLabels.map((label) => {
          const [monthName, yearStr] = label.split(" ");
          const monthIndex = months.indexOf(monthName) + 1;
          const formattedMonth = `${yearStr}-${monthIndex
            .toString()
            .padStart(2, "0")}`;
          const signup = signups.find((item) => item.month === formattedMonth);
          return yearStr === y.toString() ? (signup ? signup.count : 0) : null;
        });

        return {
          label: `Signups ${y}`,
          data,
          borderColor: yearColors[index % yearColors.length],
          backgroundColor: yearColors[index % yearColors.length],
          fill: false,
          tension: 0.1,
          spanGaps: true,
        };
      });

      return {
        labels: allLabels,
        datasets,
      };
    } else {
      const isCurrentYear = year === currentDate.getFullYear();
      const labels = months
        .slice(0, isCurrentYear ? currentDate.getMonth() + 1 : 12)
        .map((month) => `${month} ${year}`);

      const data = labels.map((label) => {
        const [monthName, yearStr] = label.split(" ");
        const monthIndex = months.indexOf(monthName) + 1;
        const formattedMonth = `${yearStr}-${monthIndex
          .toString()
          .padStart(2, "0")}`;
        const signup = signups.find((item) => item.month === formattedMonth);
        return signup ? signup.count : 0;
      });

      return {
        labels,
        datasets: [
          {
            label: `New User Signups ${year}`,
            data,
            borderColor: yearColors[0],
            backgroundColor: yearColors[0],
            fill: false,
            tension: 0.1,
          },
        ],
      };
    }
  };

  const tracksData = {
    labels: stats?.tracksDistribution.map((item) => item.track) || [],
    datasets: [
      {
        label: "Number of Users",
        data: stats?.tracksDistribution.map((item) => item.count) || [],
        backgroundColor: ["#A333FF", "#A333FF", "#A333FF", "#A333FF"],
        borderColor: ["#A333FF", "#A333FF", "#A333FF", "#A333FF"],
        borderWidth: 1,
      },
    ],
  };

  const tracksOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Popular Challenge Categories",
        font: { size: 16 },
        color: "#2E2E38",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 100,
        },
        title: {
          display: true,
          text: "Number of Users",
          color: "#2E2E38",
        },
      },
    },
  };

  const levelsData = {
    labels: stats?.levelsDistribution.map((item) => item.level) || [],
    datasets: [
      {
        label: "Users by Skill Level",
        data: stats?.levelsDistribution.map((item) => item.count) || [],
        backgroundColor: ["#540099", "#A333FF", "#C073FF"],
        borderColor: ["#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const levelsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          font: { size: 14 },
          color: "#2E2E38",
        },
      },
      title: {
        display: true,
        text: "User Distribution by Level",
        font: { size: 16 },
        color: "#2E2E38",
      },
    },
  };

  const currentDate = new Date();
  const signupsData = stats
    ? prepareSignupsData(
        stats.newUserSignups,
        selectedYear,
        currentDate,
        stats.availableYears
      )
    : {
        labels: [],
        datasets: [
          {
            label: "New User Signups",
            data: [],
            borderColor: "#A333FF",
            backgroundColor: "#A333FF",
            fill: false,
            tension: 0.1,
          },
        ],
      };

  const signupsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          font: { size: 12 },
          color: "#2E2E38",
        },
      },
      title: {
        display: true,
        text: "New User Signups",
        font: { size: 16 },
        color: "#2E2E38",
      },
      datalabels: {
        display: true,
        color: "#2E2E38",
        font: { size: 12 },
        anchor: "end" as const,
        align: "top" as Align,
        formatter: (value: number) => (value !== null ? value : ""),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        ticks: {
          stepSize: 50,
        },
        title: {
          display: true,
          text: "Number of Signups",
          color: "#2E2E38",
        },
      },
      x: {
        title: {
          display: true,
          text: "Month",
          color: "#2E2E38",
        },
        ticks: {
          autoSkip: selectedYear === "all",
          maxTicksLimit: selectedYear === "all" ? 12 : undefined,
          maxRotation: 45,
          minRotation: 45,
          font: { size: 10 },
        },
      },
    },
  };

  const getChangeValue = (change: number | undefined): number => change ?? 0;

  if (loading)
    return (
      <p className="text-center text-lg text-[#A333FF] pt-20">Loading...</p>
    );
  if (error)
    return <p className="text-center text-red-500 pt-20">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Dashboard Overview
        </h1>
        <p className="text-sm text-[#6b6b6e] mb-6">
          Keep track of your platform growth and engagement at a glance
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 border border-[#c3c7cf] rounded-xl shadow-md flex flex-col items-center justify-center">
            <p className="text-[#2E2E38] font-bold text-lg mb-2">Total Users</p>
            <div className="flex items-center justify-between w-full">
              <p className="text-2xl font-semibold text-[#A333FF] text-center flex-1">
                {stats?.totalUsers || 0}
              </p>
              <div className="bg-[#F4E5FF] p-2 rounded-full flex items-center justify-center">
                <FiUsers className="text-[#A333FF] text-2xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getChangeValue(stats?.usersChange) >= 0 ? (
                <FiArrowUp className="text-green-500" />
              ) : (
                <FiArrowDown className="text-red-500" />
              )}
              <p className="text-sm text-[#79797d]">
                <span
                  className={
                    getChangeValue(stats?.usersChange) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {getChangeValue(stats?.usersChange) >= 0 ? "+" : ""}
                  {getChangeValue(stats?.usersChange).toFixed(1)}%
                </span>{" "}
                vs last month
              </p>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#c3c7cf] rounded-xl shadow-md flex flex-col items-center justify-center">
            <p className="text-[#2E2E38] font-bold text-lg mb-2">
              Total Comments
            </p>
            <div className="flex items-center justify-between w-full">
              <p className="text-2xl font-semibold text-[#A333FF] text-center flex-1">
                {stats?.totalComments || 0}
              </p>
              <div className="bg-[#F4E5FF] p-2 rounded-full flex items-center justify-center">
                <FiMessageSquare className="text-[#A333FF] text-2xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getChangeValue(stats?.commentsChange) >= 0 ? (
                <FiArrowUp className="text-green-500" />
              ) : (
                <FiArrowDown className="text-red-500" />
              )}
              <p className="text-sm text-[#79797d]">
                <span
                  className={
                    getChangeValue(stats?.commentsChange) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {getChangeValue(stats?.commentsChange) >= 0 ? "+" : ""}
                  {getChangeValue(stats?.commentsChange).toFixed(1)}%
                </span>{" "}
                vs last month
              </p>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#c3c7cf] rounded-xl shadow-md flex flex-col items-center justify-center">
            <p className="text-[#2E2E38] font-bold text-lg mb-2">Total Likes</p>
            <div className="flex items-center justify-between w-full">
              <p className="text-2xl font-semibold text-[#A333FF] text-center flex-1">
                {stats?.totalLikes || 0}
              </p>
              <div className="bg-[#F4E5FF] p-2 rounded-full flex items-center justify-center">
                <FiHeart className="text-[#A333FF] text-2xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getChangeValue(stats?.likesChange) >= 0 ? (
                <FiArrowUp className="text-green-500" />
              ) : (
                <FiArrowDown className="text-red-500" />
              )}
              <p className="text-sm text-[#79797d]">
                <span
                  className={
                    getChangeValue(stats?.likesChange) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {getChangeValue(stats?.likesChange) >= 0 ? "+" : ""}
                  {getChangeValue(stats?.likesChange).toFixed(1)}%
                </span>{" "}
                vs last month
              </p>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#c3c7cf] rounded-xl shadow-md flex flex-col items-center justify-center">
            <p className="text-[#2E2E38] font-bold text-lg mb-2">
              Total Reports
            </p>
            <div className="flex items-center justify-between w-full">
              <p className="text-2xl font-semibold text-[#A333FF] text-center flex-1">
                {stats?.totalReports || 0}
              </p>
              <div className="bg-[#F4E5FF] p-2 rounded-full flex items-center justify-center">
                <FiFlag className="text-[#A333FF] text-2xl" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getChangeValue(stats?.reportsChange) >= 0 ? (
                <FiArrowUp className="text-green-500" />
              ) : (
                <FiArrowDown className="text-red-500" />
              )}
              <p className="text-sm text-[#79797d]">
                <span
                  className={
                    getChangeValue(stats?.reportsChange) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {getChangeValue(stats?.reportsChange) >= 0 ? "+" : ""}
                  {getChangeValue(stats?.reportsChange).toFixed(1)}%
                </span>{" "}
                vs last month
              </p>
            </div>
          </div>
          <div className="bg-white p-4 border border-[#c3c7cf] rounded-xl shadow-md flex flex-col items-center justify-center">
            <p className="text-[#2E2E38] font-bold text-lg mb-2">
              Active Users
            </p>
            <div className="flex items-center justify-between w-full">
              <p className="text-2xl font-semibold text-[#A333FF] text-center flex-1">
                {stats?.activeUsers || 0}
              </p>
              <div className="bg-[#F4E5FF] p-2 rounded-full flex items-center justify-center">
                <FiUsers className="text-[#A333FF] text-2xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px]">
          <div className="bg-white p-4 rounded-xl shadow-md h-[300px] w-full">
            <h2 className="text-lg font-semibold text-[#2E2E38] mb-3">
              Popular Challenge Categories
            </h2>
            <div className="h-[230px]">
              <Bar data={tracksData} options={tracksOptions} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md h-[300px] w-full">
            <h2 className="text-lg font-semibold text-[#2E2E38] mb-3">
              User Distribution by Level
            </h2>
            <div className="h-[230px]">
              <Pie data={levelsData} options={levelsOptions} />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-4 rounded-xl shadow-md w-full min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2E2E38]">
              New User Signups
            </h2>
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === "all" ? "all" : parseInt(e.target.value)
                )
              }
              className="border border-[#c3c7cf] focus:outline-0 rounded-md p-2 text-[#2E2E38]"
            >
              <option value="all">All Years</option>
              {stats?.availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full h-full min-h-[300px]">
            <Line data={signupsData} options={signupsOptions} />
          </div>
        </div>

        <div className="mt-8 bg-white p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-[#2E2E38] mb-4">
            Top 10 Creatives of {stats?.monthName || "the Month"}
          </h2>

          {/* Desktop & Tablet: Grid (2 أو 3 أعمدة) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.top10Creatives.map((creative, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-[#F5F5F7] rounded-2xl p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="text-[#A333FF] font-bold rounded-full w-9 h-9 flex items-center justify-center text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2E2E38] text-sm truncate max-w-[120px]">
                      {creative.name}
                    </p>
                    <p className="text-xs text-[#79797d]">
                      Streak: {creative.streak}
                    </p>
                  </div>
                </div>
                <p className="text-[#2E2E38] font-semibold text-sm">
                  {creative.points} pts
                </p>
              </div>
            ))}
          </div>

          {/* Mobile: Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {stats?.top10Creatives.map((creative, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-64 bg-[#F5F5F7] rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="text-[#A333FF] font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-[#2E2E38] text-sm">
                        {creative.name}
                      </p>
                      <p className="text-xs text-[#79797d]">
                        Streak: {creative.streak}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#2E2E38] font-semibold text-sm">
                    {creative.points} pts
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
