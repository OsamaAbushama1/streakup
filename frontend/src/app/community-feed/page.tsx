// app/community-feed/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import HomeHeader from "../components/Home/HomeHeader";
import LandingFooter from "../components/Landing/LandingFooter";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";
import { Metadata } from "../components/Metadata/Metadata";

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
    track?: string;
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
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();

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
      <>
        <Metadata title="Community Feed" description="Explore the latest challenges shared by the StreakUp community" />
        <div className="min-h-screen bg-white">
          <HomeHeader />
          <div className="container mx-auto px-4 py-10 xl:max-w-7xl">
            <SkeletonCard count={6} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Metadata title="Community Feed" description="Explore the latest challenges shared by the StreakUp community and get inspired by creative projects" keywords="community feed, shared challenges, creative projects, StreakUp" />
      <div className="min-h-screen bg-white">
        <HomeHeader />

        {/* === HERO SECTION (نفس الـ Home) === */}
        <div className="container rounded-lg mx-auto mt-10 mb-5 py-5 px-6 xl:max-w-7xl bg-[url('/imgs/banner.jpg')] bg-cover bg-center flex flex-col items-center justify-center text-white">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full text-[#ffffff] font-semibold shadow pt-2 pr-4.5 pb-2 pl-2.25 bg-white/32 border border-white/12 text-sm sm:text-base">
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

          <h1 className="text-[#ffffff] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-center px-2">
            Welcome Back, {firstName}!
          </h1>

          <p className="text-sm sm:text-base md:text-lg max-w-2xl text-[#ffffff] mb-6 sm:mb-8 px-4 text-center">
            Explore the latest challenges shared by the community and get
            inspired!
          </p>

          <button
            onClick={() => handleButtonClick(() => router.push("/challenge-center"))}
            disabled={isButtonDisabled}
            className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 text-[#ffffff] font-semibold rounded-full hover:bg-white/20 transition bg-white/40 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isButtonDisabled ? "Loading..." : "Go to Challenge Center"}
          </button>
        </div>

        {/* === Community Feed Content === */}
        <div className="container mx-auto px-4 py-10 xl:max-w-7xl">
          {/* === Tabs (نفس الـ Home) === */}
          <div className="flex sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 px-3">
            <h2 className="mt-[6px] text-xl sm:text-3xl font-bold text-[#8981FA]">
              Community Feed
            </h2>
            <div className="flex bg-[#B0B0B8] p-1 rounded-full">
              <button
                onClick={() => {
                  setActiveTab("recent");
                  setPage(1);
                }}
                className={`px-2 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium transition mr-1 text-sm sm:text-base ${activeTab === "recent"
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
                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium transition text-sm sm:text-base ${activeTab === "trending"
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
            <SkeletonCard count={6} />
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
                      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 hover:shadow-2xl border border-white/20"
                      onClick={() => handleButtonClick(() => router.push(route))}
                      style={{
                        cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                        opacity: isButtonDisabled ? 0.6 : 1,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                        boxShadow: '0 8px 32px 0 rgba(137, 129, 250, 0.1)',
                      }}
                    >
                      {/* Gradient Border Effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8981FA]/20 via-[#A333FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                      {/* User Info Section - At the top */}
                      <div className="relative p-4 pb-3 bg-gradient-to-r from-white/50 to-transparent backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#8981FA] to-[#A333FF] rounded-full opacity-50"></div>
                            <Image
                              src={getImageUrl(item.user?.profilePicture)}
                              alt="Profile"
                              width={48}
                              height={48}
                              className="relative w-12 h-12 rounded-full object-cover border-2 border-white"
                              onError={(e) =>
                                (e.currentTarget.src = "/imgs/default-profile.jpg")
                              }
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-900 truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                              {item.user?.firstName || "Unknown"}{" "}
                              {item.user?.lastName || "User"}
                            </p>
                            <p className="text-sm font-medium text-[#828282] truncate">
                              {item.user?.track || "No Track"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Challenge Image with Overlay */}
                      <div className="relative overflow-hidden rounded-lg px-4">
                        <Image
                          src={
                            item.images[0]
                              ? getImageUrl(item.images[0])
                              : "/imgs/projectImage.png"
                          }
                          alt={item.challenge.name}
                          width={400}
                          height={250}
                          className="w-full h-auto object-cover transition-transform duration-300 rounded-lg"
                          onError={(e) =>
                            (e.currentTarget.src = "/imgs/projectImage.png")
                          }
                        />
                      </div>

                      {/* Challenge Info Section */}
                      <div className="relative p-4 pt-3 bg-white/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-base font-semibold text-[#000000] uppercase tracking-wide truncate">
                            {item.challenge.project
                              ? item.challenge.project.name
                              : "No Project"}
                          </p>
                        </div>
                        <h3
                          className={`text-sm sm:text-base font-bold line-clamp-2 transition-colors duration-200 ${activeTab === "trending"
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A333FF] to-[#8981FA]"
                            : "text-[#828282] group-hover:text-[#8981FA]"
                            }`}
                        >
                          {activeTab === "trending" && (
                            <span className="inline-flex items-center gap-1 mr-1">
                              <span className="text-orange-500">🔥</span>
                            </span>
                          )}
                          {item.challenge.name}
                          {item.highlighted && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                              ⭐ Featured
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Bottom Gradient Accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8981FA] via-[#A333FF] to-[#8981FA] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex items-center gap-2 bg-white rounded-full shadow-lg px-6 py-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`p-2 rounded-full transition ${page === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-100 hover:text-[#8981FA]"
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPage(i + 1)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition ${page === i + 1
                            ? "bg-[#8981FA] text-white shadow-md"
                            : "text-gray-500 hover:bg-gray-100"
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`p-2 rounded-full transition ${page === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:bg-gray-100 hover:text-[#8981FA]"
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <LandingFooter />
      </div>
    </>
  );
}
