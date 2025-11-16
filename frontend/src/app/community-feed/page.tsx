// app/community-feed/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import HomeHeader from "../components/Home/HomeHeader";
import LandingFooter from "../components/Landing/LandingFooter";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

interface SharedChallenge {
  _id: string;
  description: string;
  images: string[];
  challenge: {
    challengeId: string;
    name: string;
    category: string;
    views: number;
    likes: number;
    project: { _id: string; name: string } | null;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string;
  };
  highlighted: boolean;
}

export default function CommunityFeedPage() {
  const [activeTab, setActiveTab] = useState<"recent" | "trending">("recent");
  const [sharedChallenges, setSharedChallenges] = useState<SharedChallenge[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [firstName, setFirstName] = useState("User"); // للـ Welcome
  const limit = 6;

  const router = useRouter();
  const backendUrl = API_BASE_URL;

  const getImageUrl = (path: string | undefined): string => {
    if (!path) return "/imgs/profileImage.png";
    if (!path.startsWith("http")) {
      return `${backendUrl}${path.startsWith("/") ? path : `/${path}`}`;
    }
    return path;
  };

  // جلب الـ Auth + الاسم
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/auth/profile`, {
          credentials: "include",
        });
        if (!res.ok) {
          router.push("/login");
        } else {
          const data = await res.json();
          setFirstName(data.user.firstName || "User");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // جلب التحديات
  // جلب التحديات
  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${backendUrl}/api/shared?tab=${activeTab}&page=${page}&limit=${limit}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          const err = await res.json();
          if (res.status === 401) router.push("/login");
          throw new Error(err.message || "Failed to load");
        }

        const data = await res.json();
        setSharedChallenges(data.sharedChallenges);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        // الحل هنا: استخدمنا unknown بدل any
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (!isCheckingAuth) fetchChallenges();
  }, [activeTab, page, isCheckingAuth, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A333FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      {/* === HERO SECTION (نفس الـ Home) === */}
      <div className="container rounded-lg mx-auto mt-10 mb-5 py-5 px-6 xl:max-w-7xl bg-[linear-gradient(135deg,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] flex flex-col items-center justify-center text-white">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full text-[#A333FF] font-semibold shadow pt-2 pr-4.5 pb-2 pl-2.25 bg-white/32 border border-white/12 text-sm sm:text-base">
            <span className="bg-white/12 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] rounded-full flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8">
              <Image
                src="/imgs/star.png"
                alt="star icon"
                width={24}
                height={24}
                className="w-4 h-4 sm:w-6 sm:h-6 md:w-4 md:h-4"
              />
            </span>
            Community Inspiration
          </span>
        </div>

        <h1 className="text-[#000000] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-center px-2">
          Welcome Back, {firstName}!
        </h1>

        <p className="text-sm sm:text-base md:text-lg max-w-2xl text-[#2E2E38] mb-6 sm:mb-8 px-4 text-center">
          Explore the latest challenges shared by the community and get
          inspired!
        </p>

        <button
          onClick={() => router.push("/challenge-center")}
          className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 text-[#A333FF] font-semibold rounded-full hover:bg-white/20 transition bg-white/40 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] text-sm sm:text-base"
        >
          Go to Challenge Center
        </button>
      </div>

      {/* === Community Feed Content === */}
      <div className="container mx-auto px-4 py-10 xl:max-w-7xl">
        {/* === Tabs (نفس الـ Home) === */}
        <div className="flex sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 px-3">
          <h2 className="mt-[6px] text-xl sm:text-3xl font-bold text-[#000000]">
            Community Feed
          </h2>
          <div className="flex bg-[#B0B0B8] p-1 rounded-full">
            <button
              onClick={() => {
                setActiveTab("recent");
                setPage(1);
              }}
              className={`px-2 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium transition mr-1 text-sm sm:text-base ${
                activeTab === "recent"
                  ? "bg-[#F5F5F7] text-[#000000] shadow"
                  : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => {
                setActiveTab("trending");
                setPage(1);
              }}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium transition text-sm sm:text-base ${
                activeTab === "trending"
                  ? "bg-[#F5F5F7] text-[#000000] shadow"
                  : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
              }`}
            >
              Trending
            </button>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg animate-pulse h-80"
              ></div>
            ))}
          </div>
        ) : activeTab === "trending" ? (
          <div className="text-center py-20">
            <p className="text-[#2E2E38] text-lg">
              Trending challenges coming soon!
            </p>
          </div>
        ) : sharedChallenges.length === 0 ? (
          <div className="text-center py-20 text-[#2E2E38] text-lg">
            No challenges found.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedChallenges.map((item) => {
                const username = item.user?.username?.trim();
                const challengeId = item.challenge?.challengeId;
                const route =
                  username && challengeId
                    ? `/${username}/${challengeId}`
                    : `/shared/${item._id}`;

                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                    onClick={() => router.push(route)}
                  >
                    <Image
                      src={
                        item.images[0]
                          ? getImageUrl(item.images[0])
                          : "/imgs/projectImage.png"
                      }
                      alt={item.challenge.name}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover"
                      onError={(e) =>
                        (e.currentTarget.src = "/imgs/projectImage.png")
                      }
                    />
                    <div className="p-4">
                      <p className="text-sm text-[#2E2E38] mb-1 truncate">
                        {item.challenge.project?.name || "No Project"}
                      </p>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-[#2E2E38]">
                        {item.challenge.name}
                        {item.highlighted && (
                          <span className="ml-2 text-yellow-500 text-xs">
                            [Highlighted]
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Image
                          src={getImageUrl(item.user?.profilePicture)}
                          alt="Profile"
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {item.user?.firstName} {item.user?.lastName}
                          </p>
                          {username ? (
                            <p className="text-xs text-gray-500">@{username}</p>
                          ) : (
                            <p className="text-xs text-red-500">
                              username missing
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    page === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-[#A333FF] text-white hover:bg-[#9225e5]"
                  }`}
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      page === i + 1
                        ? "bg-[#A333FF] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    page === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-[#A333FF] text-white hover:bg-[#9225e5]"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
