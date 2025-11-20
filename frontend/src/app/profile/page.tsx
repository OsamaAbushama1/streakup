"use client";
import React, { useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/config/api";
import { FiCheckCircle, FiEye, FiHeart, FiLock } from "react-icons/fi";
import { BiComment } from "react-icons/bi";
import {
  FaEye,
  FaFireAlt,
  FaHeart,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";
import Image from "next/image";
import { BsLightbulb } from "react-icons/bs";
import { useRouter } from "next/navigation";
import HomeHeader from "../components/Home/HomeHeader";
import LandingFooter from "../components/Landing/LandingFooter";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";

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
  newBadges?: string[];
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
  store: { _id: string; name: string; points: number; description: string; isLocked: boolean; icon: string }[];
}
type CertificateRank = "Bronze" | "Silver" | "Gold" | "Platinum";
type UnlockableRank = "Silver" | "Gold" | "Platinum";

interface Certificate {
  rank: CertificateRank; // Rank is already defined as "Bronze" | "Silver" | ...
  paid: boolean;
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("My Challenges");
  const [userData, setUserData] = useState<User | null>(null);
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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedRank, setSelectedRank] = useState<string>("");
  const [rankRequirements, setRankRequirements] = useState<
    Record<UnlockableRank, number>
  >({
    Silver: 0,
    Gold: 0,
    Platinum: 0,
  });
  const [newBadge, setNewBadge] = useState<string | null>(null);

  const router = useRouter();

  const backendUrl = API_BASE_URL;
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();

  const getImageUrl = (
    path: string | undefined | null,
    fallback: string = "/imgs/default-profile.jpg"
  ): string => {
    if (!path) return fallback;
    const normalized = path.trim();
    if (!normalized) return fallback;
    if (normalized.startsWith("http")) return normalized;
    return `${backendUrl}${normalized.startsWith("/") ? normalized : `/${normalized}`
      }`;
  };
  const tabs = [
    "My Challenges",
    "Analytics",
    "Points & Rewards",
    "My Certificates",
  ] as const;
  type TabType = (typeof tabs)[number];

  const handleUnlock = (rank: string, current: number, required: number) => {
    if (required === 0) return;
    const isFree = current >= required;

    if (isFree) {
      // لو مجاني → نزّلها مباشرة
      downloadCertificate(rank);
      return;
    }

    setSelectedRank(rank);
    setShowPayment(true);
  };

  const handlePayment = async (method: "instapay" | "vodafone_cash") => {
    const res = await fetch(`${backendUrl}/api/auth/certificates/unlock`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank: selectedRank, paymentMethod: method }),
    });

    if (res.ok) {
      alert("Payment successful! Certificate sent to your email.");
      setShowPayment(false);

      // تحديث الشهادات
      const updated = await fetch(`${backendUrl}/api/auth/certificates`, {
        credentials: "include",
      });
      const data = await updated.json();
      setCertificates(data.certificates);

      // تحديث userData
      const profileRes = await fetch(`${backendUrl}/api/auth/profile`, {
        credentials: "include",
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserData(profileData.user);
      }
    } else {
      alert("Payment failed. Try again.");
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push("/login");
            return;
          }
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        const data = await response.json();
        setUserData(data.user);

        const sharedChallengesResponse = await fetch(
          `${backendUrl}/api/shared/my`,
          {
            credentials: "include",
          }
        );
        if (!sharedChallengesResponse.ok) {
          throw new Error(
            `Failed to fetch my shared challenges: ${sharedChallengesResponse.statusText}`
          );
        }
        const sharedChallengesData = await sharedChallengesResponse.json();

        const sharedWithLikes = await Promise.all(
          sharedChallengesData.sharedChallenges.map(
            async (shared: SharedChallenge) => {
              const likeStatusRes = await fetch(
                `${backendUrl}/api/shared/${shared._id}/like-status`,
                {
                  method: "GET",
                  credentials: "include",
                }
              );
              if (!likeStatusRes.ok) {
                throw new Error("Failed to fetch like status");
              }
              const likeStatusData = await likeStatusRes.json();
              return { ...shared, isLiked: likeStatusData.isLiked };
            }
          )
        );

        const sortedChallenges = sharedWithLikes.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMySharedChallenges(sortedChallenges);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching profile or shared challenges:", err);
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserProfile();
  }, [router]);

  useEffect(() => {
    if (userData?.newBadges && userData.newBadges.length > 0) {
      setNewBadge(userData.newBadges[0]);
    }
  }, [userData]);

  const closeBadgePopup = async () => {
    setNewBadge(null);
    try {
      await fetch(`${backendUrl}/api/auth/ack-badges`, {
        method: "POST",
        credentials: "include",
      });
      // Update local state to remove new badges
      if (userData) {
        setUserData({ ...userData, newBadges: [] });
      }
    } catch (err) {
      console.error("Failed to acknowledge badges", err);
    }
  };

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

  useEffect(() => {
    if (activeTab === "Analytics") {
      const fetchAnalytics = async () => {
        try {
          const response = await fetch(`${backendUrl}/api/auth/analytics`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch analytics");
          const data = await response.json();
          setAnalytics(data);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Unknown error");
          console.error("Error fetching analytics:", err);
        }
      };
      fetchAnalytics();
    } else if (activeTab === "Points & Rewards") {
      const fetchRewards = async () => {
        try {
          const response = await fetch(`${backendUrl}/api/auth/rewards`, {
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch rewards");
          const data = await response.json();
          const badges = data.badges.map(
            (
              badge: { name: string; isUnlocked: boolean; description: string },
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
          const store = data.store;
          setRewards({
            points: data.points,
            badges,
            store,
          });
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Unknown error");
          console.error("Error fetching rewards:", err);
        }
      };
      fetchRewards();
    } else if (activeTab === "My Certificates") {
      const fetchRankRequirements = async () => {
        try {
          const res = await fetch(`${backendUrl}/api/auth/rank-requirements`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setRankRequirements(data.requirements);
          } else {
            // لو الـ API فشل → استخدم قيم افتراضية
            setRankRequirements({ Silver: 600, Gold: 1200, Platinum: 1800 });
          }
        } catch (err) {
          console.warn("Failed to fetch rank requirements:", err);
          setRankRequirements({ Silver: 600, Gold: 1200, Platinum: 1800 });
        }
      };
      const fetchCertificates = async () => {
        try {
          const res = await fetch(`${backendUrl}/api/auth/certificates`, {
            credentials: "include",
          });
          const data = await res.json();
          setCertificates(data.certificates);
        } catch (err) {
          console.error(err);
        }
      };
      fetchRankRequirements();
      fetchCertificates();
    }
  }, [activeTab, backendUrl]);
  useEffect(() => {
    if (showHighlightPopup && nonHighlightedChallenges.length === 0) {
      const fetchNonHighlighted = async () => {
        try {
          const res = await fetch(
            `${backendUrl}/api/shared/my-non-highlighted`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            setNonHighlightedChallenges(data.sharedChallenges || []);
          }
        } catch (err) {
          console.warn("Failed to fetch non-highlighted:", err);
        }
      };
      fetchNonHighlighted();
    }
  }, [showHighlightPopup]);

  useEffect(() => {
    if (showBoostPopup && nonCompletedChallenges.length === 0) {
      const fetchNonCompleted = async () => {
        try {
          const res = await fetch(
            `${backendUrl}/api/auth/non-completed-challenges`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            setNonCompletedChallenges(data.challenges || []);
          }
        } catch (err) {
          console.warn("Failed to fetch non-completed:", err);
        }
      };
      fetchNonCompleted();
    }
  }, [showBoostPopup]);

  const downloadCertificate = async (rank?: string) => {
    if (!rank || rank === "Bronze" || !userData) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/auth/certificate?rank=${rank}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Failed to download certificate");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rank}_Certificate_${userData.firstName}_${userData.lastName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert("Certificate downloaded successfully!");
    } catch (err) {
      console.error("Error downloading certificate:", err);
      alert("An error occurred while downloading the certificate");
    }
  };

  const handleLike = async (sharedId: string, index: number) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/shared/${sharedId}/like`,
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
      if (userData) {
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
      console.log("Attempting to redeem reward:", rewardName);
      const pointsRequired: { [key: string]: number } = {
        "Highlight Shared Challenge": 400,
        "Streak Saver": 200,
        "Challenge Boost": 500,
      };

      // Check if reward is locked
      const rewardItem = rewards?.store.find(r => r.name === rewardName);
      if (rewardItem?.isLocked) {
        setWarningMessage("This reward is currently locked.");
        setShowWarningPopup(true);
        return;
      }

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
      console.log("Backend response:", data);
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
  const refetchMySharedChallenges = async () => {
    try {
      const sharedChallengesResponse = await fetch(
        `${backendUrl}/api/shared/my`,
        { credentials: "include" }
      );
      if (!sharedChallengesResponse.ok)
        throw new Error("Failed to refetch shared challenges");

      const sharedChallengesData = await sharedChallengesResponse.json();

      const sharedWithLikes = await Promise.all(
        sharedChallengesData.sharedChallenges.map(
          async (shared: SharedChallenge) => {
            const likeStatusRes = await fetch(
              `${backendUrl}/api/shared/${shared._id}/like-status`,
              { method: "GET", credentials: "include" }
            );
            if (!likeStatusRes.ok) return { ...shared, isLiked: false };
            const likeStatusData = await likeStatusRes.json();
            return { ...shared, isLiked: likeStatusData.isLiked };
          }
        )
      );

      const sortedChallenges = sharedWithLikes.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMySharedChallenges(sortedChallenges);
    } catch (err) {
      console.error("Error refetching shared challenges:", err);
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

      // تحديث النقاط
      setRewards((prev) => (prev ? { ...prev, points: data.points } : prev));
      setUserData((prev) => (prev ? { ...prev, points: data.points } : prev));

      // أعد جلب التحديات من الـ API (مصدر واحد!)
      await refetchMySharedChallenges();

      setShowHighlightPopup(false);
      setSelectedChallengeId(null);
      alert("Challenge highlighted successfully!");
    } catch (err) {
      setWarningMessage(err instanceof Error ? err.message : "Unknown error");
      setShowWarningPopup(true);
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

      setRewards((prev) => (prev ? { ...prev, points: data.points } : prev));
      setUserData((prev) => (prev ? { ...prev, points: data.points } : prev));

      // أعد جلب التحديات
      await refetchMySharedChallenges();

      setShowBoostPopup(false);
      setSelectedChallengeId(null);
      alert("Challenge boosted successfully!");
    } catch (err) {
      setWarningMessage(err instanceof Error ? err.message : "Unknown error");
      setShowWarningPopup(true);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <HomeHeader />
        <div className="container mx-auto max-w-full px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-8 md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
          <div className="bg-[#F4E5FF] rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <Skeleton variant="avatar" width={48} height={48} />
              <div className="flex-1">
                <Skeleton variant="text" width="40%" height={24} className="mb-2" />
                <Skeleton variant="text" width="60%" height={16} className="mb-4" />
                <div className="flex gap-2">
                  <Skeleton variant="rectangular" width={100} height={24} />
                  <Skeleton variant="rectangular" width={100} height={24} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:flex sm:justify-evenly">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton variant="text" width={60} height={24} className="mx-auto mb-1" />
                  <Skeleton variant="text" width={80} height={16} className="mx-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6">
            <Skeleton variant="text" width="30%" height={32} className="mb-4" />
            <SkeletonCard count={6} />
          </div>
        </div>
      </div>
    );
  if (error) return <p>Error: {error}</p>;
  if (!userData) return <p>No user data</p>;

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />
      <div className="container mx-auto max-w-full px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-8 md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
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
                  {userData.badges?.map((badge, index) => (
                    ["Community Helper", "Social Star", "Top Ranker"].includes(badge) && (
                      <span key={index} className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded flex items-center gap-1">
                        <FaShieldAlt /> {badge}
                      </span>
                    )
                  ))}
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
            <div className="flex flex-col items-center">
              <p className="text-[#A333FF] font-bold">
                {userData.rank ?? "Bronze"}
              </p>
              <p className="text-[#948f90] text-xs">Rank</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Congratulation Popup */}

      {newBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4 animate-bounce-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500"></div>
            <FaRocket className="text-6xl text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h3>
            <p className="text-gray-600 mb-6">
              You&apos;ve earned the <span className="font-bold text-indigo-600">{newBadge}</span> badge!
            </p>
            <button
              onClick={closeBadgePopup}
              className="bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 pt-4 gap-2 sm:gap-4">
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

        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
          <div className="flex justify-between bg-[#B0B0B8] p-1 rounded-lg">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2 font-bold rounded-full transition text-xs sm:text-sm ${activeTab === tab
                  ? "bg-[#F5F5F7] text-[#000000] shadow"
                  : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
                  } ${index !== tabs.length - 1 ? "mb-1 sm:mb-0 sm:mr-1" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "My Challenges" && (
            <div className="pt-4 bg-white">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-black">
                My Challenges
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
                      onClick={() => handleButtonClick(() => {
                        handleView(shared.challenge.challengeId, index);
                        router.push(
                          `/${userData.username}/${shared.challenge.challengeId}`
                        );
                      })}
                      style={{ cursor: isButtonDisabled ? 'not-allowed' : 'pointer', opacity: isButtonDisabled ? 0.6 : 1 }}
                    >
                      <div className="relative">
                        <Image
                          src={getImageUrl(
                            shared.images &&
                              shared.images.length > 0 &&
                              shared.images[0]
                              ? shared.images[0]
                              : undefined,
                            "/imgs/default-challenge.jpg"
                          )}
                          alt={
                            shared.challenge.name || "Shared Challenge Image"
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
                          {shared.challenge.name || "Project Name"}
                        </p>
                        <div className="flex justify-between text-xs mt-2 gap-1 sm:gap-2">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isButtonDisabled) {
                                handleButtonClick(() => handleLike(shared._id, index));
                              }
                            }}
                            className={`flex items-center gap-1 cursor-pointer rounded-full px-2 py-1 transition ${shared.isLiked ? "bg-[#FFE6F1]" : "bg-[#F5F5F7]"
                              } ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
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

          {activeTab === "Analytics" && (
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
            </div>
          )}

          {activeTab === "Points & Rewards" && (
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
            </div>
          )}
          {activeTab === "My Certificates" && (
            <div className="pt-4 bg-white">
              <h3 className="text-lg font-semibold mb-6">My Certificates</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(["Silver", "Gold", "Platinum"] as UnlockableRank[]).map(
                  (rank, index) => {
                    const cert = certificates.find(
                      (c) => c.rank === rank
                    ) || {
                      rank,
                      paid: false,
                    };

                    const required = rankRequirements[rank];
                    const currentPoints = userData?.points ?? 0;
                    const progressValue =
                      required > 0
                        ? Math.min((currentPoints / required) * 100, 100)
                        : 0;
                    const isUnlocked =
                      required > 0 && currentPoints >= required;
                    const isPaid = cert.paid;

                    const currentRankIndex = [
                      "Silver",
                      "Gold",
                      "Platinum",
                    ].indexOf(
                      userData?.rank === "Platinum"
                        ? "Platinum"
                        : userData?.rank === "Gold"
                          ? "Gold"
                          : "Silver"
                    );
                    const isCurrentRank = index === currentRankIndex;
                    const isFutureRank = index > currentRankIndex;

                    return (
                      <div
                        key={rank}
                        className={`relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${isFutureRank ? "opacity-60" : ""
                          }`}
                      >
                        {isFutureRank && (
                          <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                            <FiLock className="text-5xl text-gray-400" />
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold text-purple-700">
                            {rank} Certificate
                          </h4>
                          {isPaid && (
                            <FiCheckCircle className="text-green-500 text-3xl" />
                          )}
                        </div>

                        {/* البروجرس للرتبة الحالية */}
                        {isCurrentRank && !isPaid && (
                          <div className="mb-5">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Points</span>
                              <span className="font-semibold">
                                {currentPoints} / {required}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-700"
                                style={{ width: `${progressValue}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              {required - currentPoints} more points needed
                            </p>
                          </div>
                        )}

                        {/* زر الإجراء */}
                        {isPaid ? (
                          <button
                            onClick={() => handleButtonClick(() => downloadCertificate(rank))}
                            disabled={isButtonDisabled}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isButtonDisabled ? "Processing..." : "Download Certificate"}
                          </button>
                        ) : isCurrentRank && isUnlocked ? (
                          <button
                            onClick={() => handleButtonClick(() => {
                              setSelectedRank(rank);
                              setShowPayment(true);
                            })}
                            disabled={isButtonDisabled}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Unlock for 50 EGP
                          </button>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {activeTab === "Analytics" && (
          <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((idx) => (
              <div
                key={idx}
                className="p-4 bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col gap-4"
              >
                {[analytics?.progress1 ?? 0, analytics?.progress2 ?? 0].map(
                  (progress, subIdx) => (
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
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "Points & Rewards" && (
          <div className="col-span-full">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-[#2E2E38]">
              Badges & Achievements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
              {(rewards?.badges ?? []).map((item, index: number) => (
                <div
                  key={index}
                  className={`p-4 bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center relative group ${!item.isUnlocked ? "opacity-50" : ""
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
                  No badges available yet. Complete challenges to earn badges!
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
                    className="p-4 bg-white rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.1)] flex flex-col justify-between relative"
                  >
                    {reward.isLocked && (
                      <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg backdrop-blur-[1px]">
                        <div className="text-center">
                          <FiLock className="text-3xl text-gray-500 mx-auto mb-1" />
                          <span className="text-gray-600 font-bold text-sm">Coming Soon</span>
                        </div>
                      </div>
                    )}
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
                        className="px-3 py-2 bg-[#A333FF] text-white rounded-lg text-xs hover:bg-[#9225e5] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleButtonClick(() => handleRedeem(reward.name))}
                        disabled={isButtonDisabled}
                      >
                        {isButtonDisabled ? "Processing..." : "Redeem"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showHighlightPopup && (
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

            {showBoostPopup && (
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

            {showWarningPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
                    Warning
                  </h3>
                  <p className="text-sm text-[#2E2E38] mb-4">
                    {warningMessage}
                  </p>
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
        )}
      </div>

      {/* Payment Popup */}
      {
        showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4 text-[#2E2E38]">
                Unlock {selectedRank} Certificate
              </h3>
              <p className="text-sm text-[#2E2E38] mb-4">
                Choose your payment method to unlock the certificate for 50 EGP.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handlePayment("instapay")}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition"
                >
                  Pay with InstaPay
                </button>
                <button
                  onClick={() => handlePayment("vodafone_cash")}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition"
                >
                  Pay with Vodafone Cash
                </button>
              </div>
              <button
                onClick={() => {
                  setShowPayment(false);
                  setSelectedRank("");
                }}
                className="mt-4 w-full py-2 bg-gray-300 text-[#2E2E38] rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      }
      <LandingFooter />
    </div >
  );
};

export default Profile;
