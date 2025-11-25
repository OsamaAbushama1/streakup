"use client";
import React, { useState, useEffect } from "react";
import HomeHeader from "../components/Home/HomeHeader";
import LandingFooter from "../components/Landing/LandingFooter";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoFlame, IoStar } from "react-icons/io5";
import { FaFire } from "react-icons/fa";
import Link from "next/link";
import { API_BASE_URL } from "@/config/api";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";

interface Project {
  _id: string;
  name: string;
  track: string;
}

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
    duration?: number;
    points?: number;
    project: Project | null;
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
  views: number;
  likes: number;
}

interface TopCreator {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  track: string;
  streak: number;
  points: number;
  username?: string;
}

interface NextChallenge {
  challengeId: string;
  name: string;
  description: string;
  image: string;
  track: string;
  project: { name: string } | null;
  duration?: number;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"recent" | "trending">("recent");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [firstName, setFirstName] = useState("User");
  const [sharedChallenges, setSharedChallenges] = useState<SharedChallenge[]>(
    []
  );
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [nextChallenge, setNextChallenge] = useState<NextChallenge | null>(
    null
  );
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCreators, setLoadingCreators] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
        } else {
          const data = await res.json();
          setFirstName(data.user.firstName || "User");
        }
      } catch (error: unknown) {
        console.error("Error checking auth status:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  useEffect(() => {
    const fetchSharedChallenges = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${backendUrl}/api/shared?tab=${activeTab}&page=1&limit=6`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 403) {
            setError(
              errorData.message || "You are banned from viewing challenges"
            );
            setSharedChallenges([]);
            return;
          }
          throw new Error(
            errorData.message || "Failed to fetch shared challenges"
          );
        }

        const data = await res.json();
        setSharedChallenges(data.sharedChallenges);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Unknown error");
        console.error("Error fetching shared challenges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!isCheckingAuth) {
      fetchSharedChallenges();
    }
  }, [activeTab, isCheckingAuth, router]);

  useEffect(() => {
    const fetchTopCreators = async () => {
      setLoadingCreators(true);
      try {
        const res = await fetch(`${backendUrl}/api/auth/top-creators`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error(errorData.message || "Failed to fetch top creators");
        }

        const data = await res.json();
        setTopCreators(data.topCreators);
      } catch (error: unknown) {
        console.error("Error fetching top creators:", error);
      } finally {
        setLoadingCreators(false);
      }
    };

    if (!isCheckingAuth) {
      fetchTopCreators();
    }
  }, [isCheckingAuth, router]);

  useEffect(() => {
    const fetchNextChallenge = async () => {
      setLoadingChallenge(true);
      try {
        const res = await fetch(`${backendUrl}/api/auth/next-challenge`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch next challenge");

        const data = await res.json();
        setNextChallenge(data.nextChallenge);
        setChallengeMessage(data.message || null);
      } catch (error) {
        console.error("Error fetching next challenge:", error);
      } finally {
        setLoadingChallenge(false);
      }
    };

    if (!isCheckingAuth) {
      fetchNextChallenge();
    }
  }, [isCheckingAuth, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <HomeHeader />
        <div className="container mx-auto px-4 py-10 xl:max-w-7xl">
          <SkeletonCard count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <HomeHeader />

      {/* === Welcome Section === */}
      <div className="text-center px-3">
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
              Today&apos;s Inspiration
            </span>
          </div>

          <h1 className="text-[#000000] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-center px-2">
            Welcome Back, {firstName}!
          </h1>

          <p className="text-sm sm:text-base md:text-lg max-w-2xl text-[#2E2E38] mb-6 sm:mb-8 px-4 text-center">
            Ready to continue your streak? Check out today&apos;s challenge!
          </p>

          <Link
            href="/challenge-center"
            className="px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3 text-[#A333FF] font-semibold rounded-full hover:bg-white/20 transition bg-white/40 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_0_10px_rgba(255,255,255,0.1)] text-sm sm:text-base"
          >
            Go to Challenge Center
          </Link>
        </div>
      </div>

      {/* === Community Feed === */}
      <main className="container mx-auto pb-6 pt-0 px-0 xl:max-w-7xl">
        <div className="flex sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 px-3">
          <h2 className="mt-[6px] text-xl sm:text-3xl font-bold text-[#000000]">
            Community Feed
          </h2>
          <div className="flex bg-[#B0B0B8] p-1 rounded-full">
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-2 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium transition mr-1 text-sm sm:text-base ${activeTab === "recent"
                ? "bg-[#F5F5F7] text-[#000000] shadow"
                : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
                }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveTab("trending")}
              className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-medium transition text-sm sm:text-base ${activeTab === "trending"
                ? "bg-[#F5F5F7] text-[#000000] shadow"
                : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
                }`}
            >
              Trending
            </button>
          </div>
        </div>

        {error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-red-500">{error}</p>
          </div>
        ) : loading ? (
          <div className="px-4">
            <SkeletonCard count={6} />
          </div>
        ) : sharedChallenges.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-center text-[#2E2E38]">
              No shared challenges found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {sharedChallenges.map((sharedChallenge) => {
              const username = sharedChallenge.user?.username?.trim();
              const challengeId = sharedChallenge.challenge?.challengeId;

              // تحقق من صحة البيانات قبل أي حاجة
              const isValidNewRoute = username && challengeId;
              const fallbackRoute = `/shared/${challengeId}`;

              return (
                <div
                  key={sharedChallenge._id}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300  hover:shadow-2xl border border-white/20"
                  onClick={() => handleButtonClick(() => {
                    if (!challengeId) {
                      alert(
                        "This challenge is missing an ID and cannot be opened."
                      );
                      console.error("Missing challengeId:", sharedChallenge);
                      return;
                    }

                    if (!sharedChallenge.user) {
                      console.warn(
                        "User data missing for challenge:",
                        challengeId
                      );
                    }

                    if (isValidNewRoute) {
                      router.push(`/${username}/${challengeId}`);
                    } else {
                      console.warn(
                        `Username missing for ${sharedChallenge.user?.firstName || "user"
                        } – using old route`
                      );
                      router.push(fallbackRoute);
                    }
                  })}
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
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8981FA] to-[#A333FF] rounded-full  opacity-50"></div>
                        <Image
                          src={getImageUrl(sharedChallenge.user?.profilePicture)}
                          alt="Profile"
                          width={48}
                          height={48}
                          className="relative w-12 h-12 rounded-full object-cover border-2 border-white "
                          onError={(e) =>
                            (e.currentTarget.src = "/imgs/default-profile.jpg")
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                          {sharedChallenge.user?.firstName || "Unknown"}{" "}
                          {sharedChallenge.user?.lastName || "User"}
                        </p>
                        <p className="text-sm font-medium text-[#8981FA] truncate">
                          {sharedChallenge.user?.track || "No Track"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Challenge Image with Overlay */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <Image
                      src={
                        sharedChallenge.images[0]
                          ? getImageUrl(sharedChallenge.images[0])
                          : "/imgs/projectImage.png"
                      }
                      alt={sharedChallenge.challenge.name}
                      width={400}
                      height={250}
                      className="w-full h-auto object-cover bg-gradient-to-br from-gray-50 to-gray-100 transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/imgs/projectImage.png";
                      }}
                    />
                  </div>

                  {/* Challenge Info Section */}
                  <div className="relative p-4 pt-3 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-1 w-8 bg-gradient-to-r from-[#8981FA] to-[#A333FF] rounded-full"></div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                        {sharedChallenge.challenge.project
                          ? sharedChallenge.challenge.project.name
                          : "No Project"}
                      </p>
                    </div>
                    <h3
                      className={`text-base sm:text-lg font-bold line-clamp-2 transition-colors duration-200 ${activeTab === "trending"
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-[#A333FF] to-[#8981FA]"
                        : "text-gray-900 group-hover:text-[#8981FA]"
                        }`}
                    >
                      {activeTab === "trending" && (
                        <span className="inline-flex items-center gap-1 mr-1">
                          <span className="text-orange-500">🔥</span>
                        </span>
                      )}
                      {sharedChallenge.challenge.name}
                      {sharedChallenge.highlighted && (
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
        )}

        <div className="flex justify-center mt-8">
          <button
            className="px-6 py-2 sm:px-10 sm:py-3 bg-[#A333FF] text-white rounded-[10px] font-semibold text-base sm:text-lg shadow-md hover:bg-[#9225e5] transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleButtonClick(() => router.push("/community-feed"))}
            disabled={isButtonDisabled}
          >
            {isButtonDisabled ? "Loading..." : "Show More"}
          </button>
        </div>

        {/* === Top Creators & Learn from the Pros Side by Side === */}
        <div className="mt-16 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:max-w-7xl mx-auto">
            {/* === Top Creators of the Week === */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 lg:col-span-1">
              <div className="mb-8 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#8981FA] text-center mb-2">
                  Top Creators of the Week
                </h2>
                <p className="text-sm sm:text-base text-[#909097] text-center">
                  Celebrate the most consistent and creative users this week
                </p>
              </div>

              {loadingCreators ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-gray-50 rounded-xl p-4">
                      <Skeleton variant="avatar" width={64} height={64} className="flex-shrink-0" />
                      <div className="flex-1 w-full text-center sm:text-left">
                        <Skeleton variant="text" width="50%" height={24} className="mb-2 mx-auto sm:mx-0" />
                        <Skeleton variant="text" width="30%" height={16} className="mb-3 mx-auto sm:mx-0" />
                        <Skeleton variant="rectangular" width={100} height={36} className="mx-auto sm:mx-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : topCreators.length === 0 ? (
                <p className="text-center text-[#2E2E38] py-8">
                  No creators found this week.
                </p>
              ) : (
                <div className="space-y-5">
                  {topCreators.map((creator) => (
                    <div
                      key={creator._id}
                      className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-[#F4E5FF] hover:bg-gray-100 transition-all duration-200 rounded-xl p-4"
                    >
                      <div className="flex-shrink-0">
                        <Image
                          src={getImageUrl(creator.profilePicture)}
                          alt={`${creator.firstName} ${creator.lastName}`}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                        />
                      </div>

                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3 className="text-base sm:text-lg font-bold text-black truncate">
                          {creator.firstName} {creator.lastName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium truncate mb-3">
                          {creator.track}
                        </p>

                        <button
                          onClick={() => handleButtonClick(() => {
                            const username =
                              creator.username ||
                              `${creator.firstName}-${creator.lastName}`
                                .toLowerCase()
                                .replace(/\s+/g, "-");
                            router.push(`/profile/${username}`);
                          })}
                          disabled={isButtonDisabled}
                          className="w-full sm:w-auto px-5 py-2 bg-[#A333FF] text-white rounded-lg font-medium hover:bg-[#9225e5] transition text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isButtonDisabled ? "Loading..." : "View Profile"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* === Learn from the Pros === */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 lg:col-span-2">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#8981FA] to-[#A333FF] bg-clip-text text-transparent mb-3">
                  Learn from the Pros
                </h2>
                <p className="text-[#909097] text-sm sm:text-base max-w-2xl mx-auto">
                  Join mentorship sessions or explore premium courses to level up faster
                </p>
              </div>

              {/* Points Banner */}
              <div className="mb-4 bg-[#F6C953] rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FFF0C9] backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                    <IoStar className="w-6 h-6 text-[#F6C953]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Use Your Points!</h3>
                    <p className="text-[#ffffff] text-sm">Redeem points for mentorship sessions or premium courses</p>
                  </div>
                </div>
              </div>

              {/* Mentor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Mentor Card 1 */}
                <div className="bg-[#F4E5FF] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    {/* Profile Picture */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#8981FA] to-[#A333FF] rounded-full blur-md opacity-50"></div>
                      <div className="relative w-20 h-20 bg-white rounded-full p-1">
                        <Image
                          src="/imgs/default-profile.jpg"
                          alt="Jessica Martinez"
                          width={80}
                          height={80}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Jessica Martinez</h3>

                    {/* Expertise */}
                    <p className="text-sm text-gray-600 mb-6">UI/UX Design & Product Strategy</p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 mb-6 w-full">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#8981FA]">30</p>
                        <p className="text-xs text-gray-600">Minute</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-pink-500">400</p>
                        <p className="text-xs text-gray-600">Point</p>
                      </div>
                    </div>

                    {/* Redeem Button */}
                    <button className="w-full bg-white text-[#8981FA] font-semibold py-3 rounded-xl hover:bg-[#8981FA] hover:text-white transition-all duration-300 shadow-md">
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Mentor Card 2 */}
                <div className="bg-[#F4E5FF] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    {/* Profile Picture */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#8981FA] to-[#A333FF] rounded-full blur-md opacity-50"></div>
                      <div className="relative w-20 h-20 bg-white rounded-full p-1">
                        <Image
                          src="/imgs/default-profile.jpg"
                          alt="Jessica Martinez"
                          width={80}
                          height={80}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Jessica Martinez</h3>

                    {/* Expertise */}
                    <p className="text-sm text-gray-600 mb-6">UI/UX Design & Product Strategy</p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 mb-6 w-full">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#8981FA]">40</p>
                        <p className="text-xs text-gray-600">Minute</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-pink-500">300</p>
                        <p className="text-xs text-gray-600">Point</p>
                      </div>
                    </div>

                    {/* Redeem Button */}
                    <button className="w-full bg-white text-[#8981FA] font-semibold py-3 rounded-xl hover:bg-[#8981FA] hover:text-white transition-all duration-300 shadow-md">
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Mentor Card 3 */}
                <div className="bg-[#F4E5FF] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col items-center text-center">
                    {/* Profile Picture */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#8981FA] to-[#A333FF] rounded-full blur-md opacity-50"></div>
                      <div className="relative w-20 h-20 bg-white rounded-full p-1">
                        <Image
                          src="/imgs/default-profile.jpg"
                          alt="Jessica Martinez"
                          width={80}
                          height={80}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Jessica Martinez</h3>

                    {/* Expertise */}
                    <p className="text-sm text-gray-600 mb-6">UI/UX Design & Product Strategy</p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 mb-6 w-full">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#8981FA]">60</p>
                        <p className="text-xs text-gray-600">Minute</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-pink-500">500</p>
                        <p className="text-xs text-gray-600">Point</p>
                      </div>
                    </div>

                    {/* Redeem Button */}
                    <button className="w-full bg-white text-[#8981FA] font-semibold py-3 rounded-xl hover:bg-[#8981FA] hover:text-white transition-all duration-300 shadow-md">
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Pick Up Where You Left Off === */}
        <div className="mt-16 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 xl:max-w-7xl mx-auto">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#8981FA]">
                Pick Up Where You Left Off
              </h2>
              {nextChallenge?.duration !== undefined && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[#FFD333] bg-[#FFF9E5] px-3 py-1.5 rounded-full">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {nextChallenge.duration}{" "}
                  {nextChallenge.duration === 1 ? "Day" : "Days"}
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base text-[#909097] max-w-2xl mb-6">
              Your next challenge awaits — keep your streak alive!
            </p>

            {loadingChallenge ? (
              <div className="p-3">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <Skeleton variant="image" width={300} height={200} className="w-full md:w-64 h-48 rounded-lg" />
                  <div className="flex-1 w-full">
                    <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                    <Skeleton variant="text" width="80%" height={20} className="mb-2" />
                    <Skeleton variant="text" width="100%" height={16} className="mb-2" />
                    <Skeleton variant="text" width="90%" height={16} className="mb-6" />
                    <Skeleton variant="rectangular" width={150} height={40} className="mx-auto" />
                  </div>
                </div>
              </div>
            ) : nextChallenge ? (
              <div className="p-3">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-shrink-0">
                    <Image
                      src={
                        nextChallenge.image
                          ? getImageUrl(nextChallenge.image)
                          : "/imgs/projectImage.png"
                      }
                      alt={nextChallenge.name}
                      width={300}
                      height={200}
                      className="w-full md:w-64 h-48 rounded-lg object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full shadow-lg relative overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(135deg, #C173FF, #C1BCFF, #AAEBFF, #DEB5FF, #FFD9DD, #FFDD65)",
                            padding: "2px",
                          }}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-[#C173FF] via-[#AAEBFF] to-[#FFDD65] opacity-60 blur-md"></span>
                          <span className="relative flex items-center gap-1.5 bg-white text-[#2E2E38] px-3 py-1 rounded-full">
                            {nextChallenge.track}
                          </span>
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#2E2E38] mb-2">
                        {nextChallenge.name}
                        {nextChallenge.project && (
                          <span className="text-[#2E2E38] font-normal">
                            {" - "}
                            <span className="text-[#A333FF] font-semibold">
                              {nextChallenge.project.name}
                            </span>
                          </span>
                        )}
                      </h3>

                      <p className="text-sm text-[#2E2E38] line-clamp-3 mb-6">
                        {nextChallenge.description}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={() => handleButtonClick(() =>
                          router.push(
                            `/challenges/${nextChallenge.challengeId}`
                          )
                        )}
                        disabled={isButtonDisabled}
                        className="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#A333FF] to-[#C173FF] text-white rounded-lg font-medium hover:from-[#9225e5] hover:to-[#b05eff] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaFire className="w-5 h-5 text-white bg-transparent group-hover:animate-pulse group-hover:scale-110 transition-all duration-200" />
                        {isButtonDisabled ? "Loading..." : "Start Challenge"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg font-medium text-[#2E2E38]">
                  {challengeMessage || "New challenge coming soon!"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Stay tuned — the next challenge will be here before you know
                  it!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
