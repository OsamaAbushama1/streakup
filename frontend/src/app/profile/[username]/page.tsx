"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { FiCheckCircle, FiEye, FiHeart, FiLock } from "react-icons/fi";
import { BiComment } from "react-icons/bi";
import {
  FaEye,
  FaFireAlt,
  FaHeart,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";
import { BsLightbulb } from "react-icons/bs";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import HomeHeader from "@/app/components/Home/HomeHeader";
import { API_BASE_URL } from "@/config/api";
import LandingFooter from "@/app/components/Landing/LandingFooter";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  track: string;
  skillLevel?: string;
  profilePicture?: string;
  streak?: number;
  points?: number;
  completedChallenges?: number;
  completedProjects?: number;
  rank?: string;
  challengesViews?: number;
  appreciations?: number;
  feedback?: number;
  badges?: string[];
  challenges: string[];
  role: string;
}

interface Challenge {
  _id: string;
  name: string;
  category: string;
  status: "Active" | "Missed";
}

interface SharedChallenge {
  _id: string;
  description: string;
  images: string[];
  likes: number;
  views: number;
  comments: number;
  isLiked: boolean;
  challenge: {
    name: string;
    category: string;
    views: number;
    likes: number;
    challengeId: string;
  };
  user: { firstName: string; lastName: string; profilePicture?: string };
  highlighted: boolean;
  createdAt: string;
}

interface Analytics {
  streakCalendar: { isActive: boolean; number: number; className: string }[];
  progress1: number;
  progress2: number;
}

interface Reward {
  points: number;
  badges: {
    name: string;
    isUnlocked: boolean;
    icon: ReactNode;
    bg: string;
    description: string;
  }[];
  store: { name: string; points: number; description: string }[];
}

const PublicProfilePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const [activeTab, setActiveTab] = useState<
    "My Challenges" | "Analytics" | "Points & Rewards"
  >("My Challenges");
  const [userData, setUserData] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [mySharedChallenges, setMySharedChallenges] = useState<
    SharedChallenge[]
  >([]);
  const [nonHighlightedChallenges, setNonHighlightedChallenges] = useState<
    SharedChallenge[]
  >([]);
  const [nonCompletedChallenges, setNonCompletedChallenges] = useState<
    Challenge[]
  >([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [rewards, setRewards] = useState<Reward | null>(null);
  const [challengesViews, setChallengesViews] = useState<number>(0);
  const [appreciations, setAppreciations] = useState<number>(0);
  const [feedbacks, setFeedbacks] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [showBoostPopup, setShowBoostPopup] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(
    null
  );
  const backendUrl = API_BASE_URL;
  const tabs = ["My Challenges", "Analytics", "Points & Rewards"] as const;

  const getImageUrl = (path: string | undefined): string => {
    if (!path) return "/imgs/default-profile.jpg";
    if (!path.startsWith("http")) {
      return `${backendUrl}${path.startsWith("/") ? path : `/${path}`}`;
    }
    return path;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch authenticated user data
        const authResponse = await fetch(`${backendUrl}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });
        let authUserData = null;
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setAuthUser(authData.user);
          authUserData = authData.user;
        } else if (authResponse.status === 401 || authResponse.status === 403) {
          // Not logged in, proceed without auth user
        } else {
          throw new Error(
            `Failed to fetch auth profile: ${authResponse.statusText}`
          );
        }

        // Fetch public profile
        const profileResponse = await fetch(
          `${backendUrl}/api/auth/profile/${username}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!profileResponse.ok)
          throw new Error(
            `Failed to fetch profile: ${profileResponse.statusText}`
          );
        const profileData = await profileResponse.json();
        setUserData(profileData.user);

        // Fetch shared challenges
        const sharedChallengesResponse = await fetch(
          `${backendUrl}/api/shared/by-username/${username}`,
          { credentials: "include" }
        );
        if (!sharedChallengesResponse.ok) {
          throw new Error(
            `Failed to fetch shared challenges: ${sharedChallengesResponse.statusText}`
          );
        }
        const sharedChallengesData = await sharedChallengesResponse.json();

        const sharedWithLikes = await Promise.all(
          sharedChallengesData.sharedChallenges.map(
            async (shared: SharedChallenge) => {
              if (!shared.challenge || !shared.challenge.challengeId) {
                console.warn(
                  `Skipping like status fetch: challengeId is undefined for shared challenge ${shared._id}`
                );
                return { ...shared, isLiked: false };
              }
              const likeStatusRes = await fetch(
                `${backendUrl}/api/shared/${shared.challenge.challengeId}/like-status`,
                {
                  method: "GET",
                  credentials: "include",
                }
              );
              if (!likeStatusRes.ok) {
                console.error(
                  `Failed to fetch like status for ${shared.challenge.challengeId}`
                );
                return { ...shared, isLiked: false };
              }
              const likeStatusData = await likeStatusRes.json();
              return { ...shared, isLiked: likeStatusData.isLiked };
            }
          )
        );

        const sortedChallenges = sharedWithLikes.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMySharedChallenges(sortedChallenges);

        // If viewing own profile, fetch additional data
        if (authUserData && authUserData.username === username) {
          // Fetch analytics
          const analyticsResponse = await fetch(
            `${backendUrl}/api/auth/analytics`,
            {
              credentials: "include",
            }
          );
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData);
          }

          // Fetch rewards
          const rewardsResponse = await fetch(
            `${backendUrl}/api/auth/rewards`,
            {
              credentials: "include",
            }
          );
          if (rewardsResponse.ok) {
            const rewardsData = await rewardsResponse.json();
            const badges = rewardsData.badges.map(
              (
                badge: {
                  name: string;
                  isUnlocked: boolean;
                  description: string;
                },
                index: number
              ) => ({
                name: badge.name,
                isUnlocked: badge.isUnlocked,
                description: badge.description,
                icon:
                  index % 2 === 0 ? (
                    <BsLightbulb className="text-red-500" />
                  ) : (
                    <FaFireAlt className="text-yellow-500" />
                  ),
                bg:
                  index % 2 === 0
                    ? "bg-[rgba(255,0,0,0.1)]"
                    : "bg-[rgba(255,255,0,0.15)]",
              })
            );
            const store = [
              {
                name: "Highlight Shared Challenge",
                points: 400,
                description:
                  "Highlight your shared challenge at the top of the Shared Challenges list for 24 hours.",
              },
              {
                name: "Streak Saver",
                points: 200,
                description:
                  "Protect your streak if you miss a day without completing a challenge.",
              },
              {
                name: "Challenge Boost",
                points: 500,
                description:
                  "Complete a challenge instantly and earn its points.",
              },
            ];
            setRewards({
              points: rewardsData.points,
              badges,
              store,
            });

            // Fetch non-highlighted challenges
            try {
              const nonHighlightedResponse = await fetch(
                `${backendUrl}/api/shared/my-non-highlighted`,
                { credentials: "include" }
              );
              if (nonHighlightedResponse.ok) {
                const nonHighlightedData = await nonHighlightedResponse.json();
                setNonHighlightedChallenges(
                  nonHighlightedData.sharedChallenges || []
                );
              } else {
                console.warn(
                  `Failed to fetch non-highlighted challenges: ${nonHighlightedResponse.statusText}`
                );
                setNonHighlightedChallenges([]);
              }
            } catch (err: unknown) {
              console.warn("Error fetching non-highlighted challenges:", err);
              setNonHighlightedChallenges([]);
            }

            // Fetch non-completed challenges
            try {
              const nonCompletedResponse = await fetch(
                `${backendUrl}/api/auth/non-completed-challenges`,
                { credentials: "include" }
              );
              if (nonCompletedResponse.ok) {
                const nonCompletedData = await nonCompletedResponse.json();
                setNonCompletedChallenges(nonCompletedData.challenges || []);
              } else {
                console.warn(
                  `Failed to fetch non-completed challenges: ${nonCompletedResponse.statusText}`
                );
                setNonCompletedChallenges([]);
              }
            } catch (err: unknown) {
              console.warn("Error fetching non-completed challenges:", err);
              setNonCompletedChallenges([]);
            }
          }
        }

        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [username, router]);

  useEffect(() => {
    const totalViews = mySharedChallenges.reduce(
      (sum, shared) => sum + shared.views,
      0
    );
    const totalLikes = mySharedChallenges.reduce(
      (sum, shared) => sum + shared.likes,
      0
    );
    const totalComments = mySharedChallenges.reduce(
      (sum, shared) => sum + shared.comments,
      0
    );

    setChallengesViews(totalViews);
    setAppreciations(totalLikes);
    setFeedbacks(totalComments);
  }, [mySharedChallenges]);

  const handleLike = async (challengeId: string, index: number) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/shared/${challengeId}/like`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to like shared challenge");
      const data = await response.json();
      const updatedShared = [...mySharedChallenges];
      updatedShared[index] = {
        ...updatedShared[index],
        likes: data.likes,
        isLiked: data.isLiked,
      };
      setMySharedChallenges(updatedShared);
      if (authUser && authUser.username === username) {
        const profileResponse = await fetch(`${backendUrl}/api/auth/profile`, {
          credentials: "include",
        });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserData(profileData.user);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error liking shared challenge:", err);
    }
  };

  const handleView = async (challengeId: string, index: number) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/shared/${challengeId}/view`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to record view");
      const updatedShared = [...mySharedChallenges];
      updatedShared[index] = {
        ...updatedShared[index],
        views: updatedShared[index].views + 1,
      };
      setMySharedChallenges(updatedShared);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error recording view:", err);
    }
  };

  const handleRedeem = async (rewardName: string) => {
    try {
      const pointsRequired: { [key: string]: number } = {
        "Highlight Shared Challenge": 400,
        "Streak Saver": 200,
        "Challenge Boost": 500,
      };

      if ((userData?.points ?? 0) < pointsRequired[rewardName]) {
        setWarningMessage("Insufficient points to redeem this reward.");
        setShowWarningPopup(true);
        return;
      }

      if (rewardName === "Highlight Shared Challenge") {
        if (nonHighlightedChallenges.length === 0) {
          setWarningMessage("No non-highlighted shared challenges available.");
          setShowWarningPopup(true);
          return;
        }
        setShowHighlightPopup(true);
        return;
      }
      if (rewardName === "Challenge Boost") {
        if (nonCompletedChallenges.length === 0) {
          setWarningMessage("No non-completed challenges available.");
          setShowWarningPopup(true);
          return;
        }
        setShowBoostPopup(true);
        return;
      }

      const response = await fetch(`${backendUrl}/api/auth/redeem-reward`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardName }),
      });
      const data = await response.json();
      if (!response.ok) {
        setWarningMessage(data.message || "Failed to redeem reward");
        setShowWarningPopup(true);
        return;
      }
      setRewards((prev) =>
        prev
          ? {
              ...prev,
              points: data.points,
            }
          : prev
      );
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              points: data.points,
              ...(rewardName === "Streak Saver" && {
                streakSavers: data.streakSavers,
              }),
            }
          : prev
      );
      alert(`${rewardName} redeemed successfully!`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to redeem reward";
      setWarningMessage(errorMessage);
      setShowWarningPopup(true);
      console.error("Error redeeming reward:", err);
    }
  };

  const handleHighlightSubmit = async () => {
    if (!selectedChallengeId) {
      setWarningMessage("Please select a challenge to highlight.");
      setShowWarningPopup(true);
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/api/auth/redeem-reward`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardName: "Highlight Shared Challenge",
          challengeId: selectedChallengeId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setWarningMessage(data.message || "Failed to highlight challenge");
        setShowWarningPopup(true);
        return;
      }
      setRewards((prev) =>
        prev
          ? {
              ...prev,
              points: data.points,
            }
          : prev
      );
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              points: data.points,
            }
          : prev
      );
      setMySharedChallenges((prev) =>
        prev.map((shared) =>
          shared._id === selectedChallengeId
            ? { ...shared, highlighted: true }
            : shared
        )
      );
      setNonHighlightedChallenges((prev) =>
        prev.filter((shared) => shared._id !== selectedChallengeId)
      );
      setShowHighlightPopup(false);
      setSelectedChallengeId(null);
      alert("Challenge highlighted successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setWarningMessage(errorMessage);
      setShowWarningPopup(true);
      console.error("Error highlighting challenge:", err);
    }
  };

  const handleBoostSubmit = async () => {
    if (!selectedChallengeId) {
      setWarningMessage("Please select a challenge to boost.");
      setShowWarningPopup(true);
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/api/auth/redeem-reward`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardName: "Challenge Boost",
          challengeId: selectedChallengeId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setWarningMessage(data.message || "Failed to boost challenge");
        setShowWarningPopup(true);
        return;
      }
      setRewards((prev) =>
        prev
          ? {
              ...prev,
              points: data.points,
            }
          : prev
      );
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              points: data.points,
              challenges: [...(prev.challenges || []), selectedChallengeId],
              completedChallenges: (prev.completedChallenges || 0) + 1,
              streak: (prev.streak || 0) + 1,
              rank:
                (prev.completedChallenges || 0) + 1 >= 30
                  ? "Platinum"
                  : (prev.completedChallenges || 0) + 1 >= 20
                  ? "Gold"
                  : (prev.completedChallenges || 0) + 1 >= 10
                  ? "Silver"
                  : "Bronze",
            }
          : prev
      );
      setNonCompletedChallenges((prev) =>
        prev.filter((challenge) => challenge._id !== selectedChallengeId)
      );
      setShowBoostPopup(false);
      setSelectedChallengeId(null);
      alert("Challenge boosted successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setWarningMessage(errorMessage);
      setShowWarningPopup(true);
      console.error("Error boosting challenge:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A333FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-center text-red-500">
          {error || "User profile not found"}
        </p>
      </div>
    );
  }

  const isOwnProfile = authUser && authUser.username === username;

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />
      <div className="container mx-auto max-w-full px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-8 md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        {/* Profile Banner */}
        <div className="bg-[#F4E5FF] rounded-xl p-4 sm:p-6 flex flex-col relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden">
                <Image
                  src={getImageUrl(userData.profilePicture)}
                  alt="Profile Picture"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-black">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="text-xs sm:text-sm text-[#948f90] mt-1 mb-2">
                  {userData.email}
                </p>
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  <span className="bg-red-100 text-[#FF3347] px-2 py-1 rounded">
                    {userData.track}
                  </span>
                  {userData.skillLevel && (
                    <span className="bg-blue-100 text-[#33CFFF] px-2 py-1 rounded">
                      {userData.skillLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-2 w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12">
              <div
                className="absolute w-8 sm:w-10 md:w-12 h-10 sm:h-12 md:h-14"
                style={{
                  background:
                    "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 50%, 100% 100%, 50% 50%, 0 100%, 0 50%)",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-evenly text-center text-xs sm:text-sm mt-4">
            <div>
              <p className="text-[#A333FF] font-bold">{userData.streak ?? 0}</p>
              <p className="text-[#948f90]">Streak</p>
            </div>
            <div>
              <p className="text-[#A333FF] font-bold">{userData.points ?? 0}</p>
              <p className="text-[#948f90]">Total Points</p>
            </div>
            <div>
              <p className="text-[#A333FF] font-bold">
                {userData.completedChallenges ?? 0}
              </p>
              <p className="text-[#948f90]">Completed Challenges</p>
            </div>
            <div>
              <p className="text-[#A333FF] font-bold">
                {userData.completedProjects ?? 0}
              </p>
              <p className="text-[#948f90]">Completed Projects</p>
            </div>
            <div>
              <p className="text-[#A333FF] font-bold">
                {userData.rank ?? "Bronze"}
              </p>
              <p className="text-[#948f90]">Rank</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 pt-4 gap-2 sm:gap-4">
          {isOwnProfile && (
            <div className="col-span-1 flex flex-col w-full min-w-[180px] sm:min-w-[200px] md:min-w-[230px] items-center mb-4 md:mb-0">
              <button
                className="w-full py-2 bg-[#A333FF] text-white rounded-lg mb-4 shadow-md hover:bg-[#9225e5] transition text-sm sm:text-base"
                onClick={() => router.push("/profile/edit")}
              >
                Edit Profile Info
              </button>
              <button
                className="w-full py-2 bg-white text-[#A333FF] border border-[#A333FF] rounded-lg mb-4 shadow-md hover:bg-[#A333FF] hover:text-white transition text-sm sm:text-base"
                onClick={() => router.push("/profile/settings")}
              >
                Settings
              </button>
              <div className="w-full bg-white px-4 sm:px-6 py-4 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col gap-4">
                <div className="flex justify-between">
                  <p className="text-sm text-black font-semibold">
                    Challenges Views
                  </p>
                  <p className="text-sm text-[#595b5c]">{challengesViews}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-black font-semibold">
                    Appreciations
                  </p>
                  <p className="text-sm text-[#595b5c]">{appreciations}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-black font-semibold">Feedbacks</p>
                  <p className="text-sm text-[#595b5c]">{feedbacks}</p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`col-span-1 ${
              isOwnProfile ? "md:col-span-2 lg:col-span-3" : "md:col-span-3"
            } flex flex-col`}
          >
            {isOwnProfile && (
              <div className="flex justify-between bg-[#B0B0B8] p-1 rounded-lg">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-2 py-2 font-bold rounded-full transition text-xs sm:text-sm ${
                      activeTab === tab
                        ? "bg-[#F5F5F7] text-[#000000] shadow"
                        : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
                    } ${
                      index !== tabs.length - 1 ? "mb-1 sm:mb-0 sm:mr-1" : ""
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {(activeTab === "My Challenges" || !isOwnProfile) && (
              <div className="pt-4 bg-white">
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-black">
                  Shared Challenges
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  {mySharedChallenges.length === 0 ? (
                    <p className="text-[#2E2E38] text-sm">
                      No shared challenges yet.
                    </p>
                  ) : (
                    mySharedChallenges.map((shared, index) => (
                      <div
                        key={shared._id}
                        className="bg-[#FFFFFF] rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow duration-300 p-2 sm:p-3"
                        onClick={() => {
                          console.log("Shared challenge data:", shared);
                          console.log(
                            "Attempting navigation with challengeId:",
                            shared.challenge?.challengeId
                          );
                          if (shared.challenge?.challengeId) {
                            handleView(shared.challenge.challengeId, index);
                            router.push(
                              `/${username}/${shared.challenge.challengeId}`
                            );
                          } else {
                            console.warn(
                              `Cannot navigate: challengeId is undefined for shared challenge ${shared._id}`
                            );
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="relative">
                          <Image
                            src={
                              shared.images &&
                              shared.images.length > 0 &&
                              shared.images[0] &&
                              shared.images[0].trim()
                                ? `${backendUrl}/${shared.images[0]
                                    .trim()
                                    .replace(/^\/+/, "")}`
                                : "/imgs/default-challenge.jpg"
                            }
                            alt={
                              shared.challenge?.name || "Shared Challenge Image"
                            }
                            width={300}
                            height={192}
                            className="h-28 sm:h-36 md:h-40 lg:h-48 rounded-xl mb-3 sm:mb-4 object-cover"
                          />
                          <p className="absolute top-2 left-2 text-xs font-semibold text-[#A333FF] bg-[#F4E5FF] bg-opacity-50 px-2 py-1 rounded-xl">
                            Challenge {String(index + 1).padStart(3, "0")}
                          </p>
                        </div>
                        <div>
                          <p className="mt-2 text-[#2E2E38] font-bold text-sm">
                            {shared.challenge?.name || "Project Name"}
                          </p>
                          <div className="flex justify-between text-xs mt-2 gap-1 sm:gap-2">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (shared.challenge?.challengeId) {
                                  handleLike(
                                    shared.challenge.challengeId,
                                    index
                                  );
                                } else {
                                  console.warn(
                                    `Cannot like: challengeId is undefined for shared challenge ${shared._id}`
                                  );
                                }
                              }}
                              className={`flex items-center gap-1 cursor-pointer rounded-full px-2 py-1 transition ${
                                shared.isLiked ? "bg-[#FFE6F1]" : "bg-[#F5F5F7]"
                              }`}
                            >
                              {shared.isLiked ? (
                                <FaHeart className="text-[#FF3366] transition-all duration-200" />
                              ) : (
                                <FiHeart className="text-[#2E2E38] transition-all duration-200" />
                              )}
                              <span className="text-[#2E2E38]">
                                {shared.likes}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 text-[#2E2E38] bg-[#F5F5F7] rounded-full px-2 py-1">
                              <BiComment className="text-[#2E2E38]" />{" "}
                              {shared.comments}
                            </span>
                            <span className="flex items-center gap-1 text-[#2E2E38] bg-[#F5F5F7] rounded-full px-2 py-1">
                              <FiEye className="text-[#2E2E38]" />{" "}
                              {shared.views}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isOwnProfile && activeTab === "Analytics" && (
              <div className="pt-4 bg-white">
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-black">
                  Streak Calendar
                </h3>
                <div className="mt-4 p-[16px] sm:px-[14px] sm:py-[20px] lg:px-[16px] lg:py-[25px] bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex items-center justify-center">
                  <div className="flex justify-between items-center w-full overflow-x-auto">
                    {(analytics?.streakCalendar ?? []).map(
                      (day, index: number) => (
                        <div
                          key={index}
                          className="flex flex-col items-center mx-1 sm:mx-2"
                        >
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${day.className} flex items-center justify-center`}
                          >
                            {day.isActive && (
                              <span className="text-white text-lg sm:text-xl font-bold">
                                🔥
                              </span>
                            )}
                          </div>
                          <span className="text-xs sm:text-sm mt-2 text-black">
                            {day.number}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {[0, 1].map((idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col gap-4"
                    >
                      {[
                        analytics?.progress1 ?? 0,
                        analytics?.progress2 ?? 0,
                      ].map((progress, subIdx) => (
                        <div key={subIdx}>
                          <h4 className="text-sm sm:text-md font-semibold mb-2 text-black">
                            Progress Tracking
                          </h4>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[#2E2E38] font-medium text-sm">
                              Challenges Completed
                            </p>
                            <p className="text-black font-semibold text-sm">
                              {progress}/100
                            </p>
                          </div>
                          <div className="w-full bg-[#E2E2E2] rounded-full h-2">
                            <div
                              className="bg-[#A333FF] h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isOwnProfile && activeTab === "Points & Rewards" && (
              <div className="pt-4 bg-white">
                <div className="mt-3 p-[16px] sm:px-[14px] sm:py-[20px] lg:px-[16px] lg:py-[25px] bg-[linear-gradient(135deg,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center">
                  <h3 className="text-[18px] sm:text-[20px] font-normal mb-2 text-[#2E2E38]">
                    Your Points Balance
                  </h3>
                  <p className="text-[28px] sm:text-[32px] font-bold text-black mb-2">
                    {userData.points ?? 0}
                  </p>
                  <p className="text-[14px] sm:text-[16px] text-[#2E2E38]">
                    Keep completing challenges to earn more points!
                  </p>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-[#2E2E38] mt-4">
                  Badges & Achievements
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
                  {(rewards?.badges ?? []).map((item, index: number) => (
                    <div
                      key={index}
                      className={`p-4 bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center relative group ${
                        !item.isUnlocked ? "opacity-50" : ""
                      }`}
                      title={item.description}
                    >
                      <div
                        className={`w-16 h-16 ${item.bg} rounded-full flex items-center justify-center mb-3`}
                      >
                        <div className="text-4xl">{item.icon}</div>
                      </div>
                      <p className="text-sm font-medium text-[#2E2E38] mb-2">
                        {item.name}
                      </p>
                      {item.isUnlocked ? (
                        <FiCheckCircle className="text-green-500 text-lg" />
                      ) : (
                        <FiLock
                          className="absolute text-gray-600 text-3xl"
                          style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {(!rewards?.badges || rewards.badges.length === 0) && (
                    <p className="text-[#2E2E38] text-sm col-span-full">
                      No badges available yet. Complete challenges to earn
                      badges!
                    </p>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 text-[#2E2E38]">
                  Rewards Store
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(rewards?.store ?? []).map((reward, idx: number) => {
                    let icon: ReactNode;
                    let bg: string;

                    switch (reward.name) {
                      case "Highlight Shared Challenge":
                        icon = <FaEye className="text-yellow-500" />;
                        bg = "bg-[rgba(255,255,0,0.1)]";
                        break;
                      case "Streak Saver":
                        icon = <FaShieldAlt className="text-orange-500" />;
                        bg = "bg-[rgba(255,165,0,0.1)]";
                        break;
                      case "Challenge Boost":
                        icon = <FaRocket className="text-purple-500" />;
                        bg = "bg-[rgba(128,0,128,0.1)]";
                        break;
                      default:
                        icon = <BsLightbulb className="text-gray-500" />;
                        bg = "bg-[rgba(128,128,128,0.1)]";
                    }

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col justify-between"
                      >
                        <div
                          className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center mb-2 mx-auto`}
                        >
                          <div className="text-2xl">{icon}</div>
                        </div>
                        <p className="text-sm font-medium text-[#2E2E38] mb-2 text-center">
                          {reward.name}
                        </p>
                        <p className="text-xs text-[#595b5c] mb-2 text-center">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-[#A333FF]">
                            {reward.points} points
                          </span>
                          <button
                            className="px-3 py-2 bg-[#A333FF] text-white rounded-lg text-xs hover:bg-[#9225e5] transition font-medium"
                            onClick={() => handleRedeem(reward.name)}
                          >
                            Redeem
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popups */}
        {isOwnProfile && showHighlightPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
                Select a Challenge to Highlight
              </h3>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                value={selectedChallengeId || ""}
                onChange={(e) => setSelectedChallengeId(e.target.value)}
              >
                <option value="">Select a challenge</option>
                {nonHighlightedChallenges.map((challenge) => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.challenge.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 text-[#2E2E38] rounded-lg hover:bg-gray-400 transition"
                  onClick={() => {
                    setShowHighlightPopup(false);
                    setSelectedChallengeId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition"
                  onClick={handleHighlightSubmit}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {isOwnProfile && showBoostPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
                Select a Challenge to Boost
              </h3>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg mb-4"
                value={selectedChallengeId || ""}
                onChange={(e) => setSelectedChallengeId(e.target.value)}
              >
                <option value="">Select a challenge</option>
                {nonCompletedChallenges.map((challenge) => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 text-[#2E2E38] rounded-lg hover:bg-gray-400 transition"
                  onClick={() => {
                    setShowBoostPopup(false);
                    setSelectedChallengeId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition"
                  onClick={handleBoostSubmit}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {isOwnProfile && showWarningPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
                Warning
              </h3>
              <p className="text-sm text-[#2E2E38] mb-4">{warningMessage}</p>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition"
                  onClick={() => {
                    setShowWarningPopup(false);
                    setWarningMessage(null);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <LandingFooter />
    </div>
  );
};

export default PublicProfilePage;
