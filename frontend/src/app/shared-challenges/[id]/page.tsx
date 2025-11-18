"use client";
import React, { useState, useEffect } from "react";
import HomeHeader from "@/app/components/Home/HomeHeader";
import LandingFooter from "@/app/components/Landing/LandingFooter";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { API_BASE_URL } from "@/config/api";
import {
  FiHeart,
  FiMessageSquare,
  FiEye,
  FiLink,
  FiLinkedin,
  FiFlag,
} from "react-icons/fi";
import { Skeleton, SkeletonCard } from "../../components/Skeleton";
import { useButtonDisable } from "../../hooks/useButtonDisable";
import { Metadata } from "../../components/Metadata/Metadata";

interface Project {
  _id: string;
  name: string;
}

interface SharedChallenge {
  _id: string;
  description: string;
  images: string[];
  challenge: {
    name: string;
    category: string;
    challengeId: string;
    views: number;
    likes: number;
    duration?: number;
    points?: number;
    project: Project | null; // إضافة حقل project
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string;
  };
  likes: number;
  views: number;
}

interface Comment {
  _id: string;
  user: { firstName: string; lastName: string; profilePicture?: string };
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isReported: boolean;
  deletedAt: string | null;
}

interface RawComment {
  _id: string;
  user: { firstName: string; lastName: string; profilePicture?: string };
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  isReported: boolean;
  deletedAt: string | null;
}

interface SharedChallengeDetailsPageProps {
  params: Promise<{ id: string }>;
}

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const commentDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - commentDate.getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

const SharedChallengeDetailsPage: React.FC<SharedChallengeDetailsPageProps> = ({
  params,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const commentId = searchParams.get("commentId");
  const [sharedChallenge, setSharedChallenge] =
    useState<SharedChallenge | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(
    null
  );
  const backendUrl = API_BASE_URL;
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();

  const getImageUrl = (path: string | undefined): string => {
    if (!path) return "/imgs/default-profile.jpg";
    if (!path.startsWith("http")) {
      return `${backendUrl}${path.startsWith("/") ? path : `/${path}`}`;
    }
    return path;
  };

  useEffect(() => {
    const fetchData = async () => {
      // Resolve the params Promise
      const { id } = await params;
      console.log("Received challengeId:", id);

      // Validate id
      if (!id || id === "undefined") {
        setError("Invalid challenge ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch current user profile to get user ID
        const profileRes = await fetch(`${backendUrl}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCurrentUserId(profileData.user._id);
        }

        // Fetch shared challenge details
        const challengeRes = await fetch(`${backendUrl}/api/shared/${id}`, {
          method: "GET",
          credentials: "include",
        });

        if (!challengeRes.ok) {
          if (challengeRes.status === 401 || challengeRes.status === 403) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch shared challenge");
        }

        const challengeData = await challengeRes.json();
        setSharedChallenge(challengeData.sharedChallenge);
        setIsOwner(
          currentUserId
            ? challengeData.sharedChallenge.user._id === currentUserId
            : false
        );

        // Increment view count
        console.log(`Sending view request for challenge ${id}`);
        const viewRes = await fetch(`${backendUrl}/api/shared/${id}/view`, {
          method: "POST",
          credentials: "include",
        });
        if (!viewRes.ok) {
          console.error(`Failed to increment view: ${viewRes.status}`);
        } else {
          const viewData = await viewRes.json();
          console.log(`View incremented successfully for challenge ${id}`);
          setSharedChallenge((prev) =>
            prev
              ? {
                  ...prev,
                  views: viewData.views,
                }
              : prev
          );
          setHasIncrementedView(true);
        }

        // Fetch like status
        const likeStatusRes = await fetch(
          `${backendUrl}/api/shared/${id}/like-status`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!likeStatusRes.ok) {
          throw new Error("Failed to fetch like status");
        }

        const likeStatusData = await likeStatusRes.json();
        setIsLiked(likeStatusData.isLiked);

        // Fetch comments
        const commentsRes = await fetch(
          `${backendUrl}/api/comments/shared/${id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!commentsRes.ok) {
          throw new Error("Failed to fetch comments");
        }

        const commentsData = await commentsRes.json();
        setComments(
          commentsData.comments.map((comment: RawComment) => ({
            ...comment,
            isLiked: commentsData.currentUserId
              ? comment.likedBy.includes(commentsData.currentUserId)
              : false,
            isReported: comment.isReported || false,
            deletedAt: comment.deletedAt || null,
          }))
        );
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, router, currentUserId]);
  // قراءة الـ commentId من localStorage (اللي حطيناه من HomeHeader)
  useEffect(() => {
    const id = localStorage.getItem("scrollToComment");
    if (id) {
      setHighlightCommentId(id);
      localStorage.removeItem("scrollToComment"); // نمسحه عشان ما يتكررش
    }
  }, []);

  // سكرول + هايلايت للكومنت
  useEffect(() => {
    if (loading || !comments.length || !highlightCommentId) return;

    const el = document.getElementById(`comment-${highlightCommentId}`);
    if (el) {
      // مسافة للهيدر الثابت
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: "smooth",
      });

      // هايلايت أصفر فاتح
      el.style.backgroundColor = "#fef3c7";
      el.style.transition = "background-color 0.5s";

      setTimeout(() => {
        el.style.backgroundColor = "";
      }, 3000);
    }
  }, [loading, comments, highlightCommentId]);

  const handleLike = async () => {
    await handleButtonClick(async () => {
      const { id } = await params;
      if (!id) return;

      try {
        const res = await fetch(`${backendUrl}/api/shared/${id}/like`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to like/unlike shared challenge");
        }

        const data = await res.json();
        setIsLiked(data.isLiked);
        setSharedChallenge((prev) =>
          prev
            ? {
                ...prev,
                likes: data.likes,
              }
            : prev
        );
      } catch (error) {
        console.error("Error liking/unliking shared challenge:", error);
      }
    });
  };

  const handleLikeComment = async (commentId: string) => {
    await handleButtonClick(async () => {
      try {
        const res = await fetch(`${backendUrl}/api/comments/${commentId}/like`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to like/unlike comment");
        }

        const data = await res.json();
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? { ...comment, likes: data.likes, isLiked: data.isLiked }
              : comment
          )
        );
      } catch (error) {
        console.error("Error liking/unliking comment:", error);
      }
    });
  };

  const handleReportComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `${backendUrl}/api/comments/${commentId}/report`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to report comment");
      }

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId ? { ...comment, isReported: true } : comment
        )
      );
      alert("Comment reported successfully");
    } catch (error) {
      console.error("Error reporting comment:", error);
      alert("Failed to report comment");
    }
  };

  const handleAddComment = async () => {
    const { id } = await params;
    if (!id) {
      setError("Invalid challenge ID");
      return;
    }

    if (!newComment.trim()) {
      setError("Please enter a comment");
      return;
    }

    if (newComment.trim().length > 500) {
      setError("Comment must not exceed 500 characters");
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/comments/shared/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add comment");
      }

      const data = await res.json();
      setComments((prev) => [
        ...prev,
        { ...data.comment, isLiked: false, isReported: false, deletedAt: null },
      ]);
      setNewComment("");
      setError(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to add comment. Please try again."
      );
    }
  };

  const handleCopyLink = async () => {
    const { id } = await params;
    if (!id) return;

    const link = `${window.location.origin}/shared/${id}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  const handleShareToLinkedIn = async () => {
    const { id } = await params;
    if (!id) return;

    const url = encodeURIComponent(`${window.location.origin}/shared/${id}`);
    const title = encodeURIComponent(
      sharedChallenge?.challenge.name || "Shared Challenge"
    );
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`;
    window.open(linkedInUrl, "_blank");
  };

  const handleProfileClick = () => {
    handleButtonClick(() => {
      if (isOwner) {
        router.push("/profile");
      } else {
        router.push(`/profile/${sharedChallenge?.user.username}`);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff]">
        <HomeHeader />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-7xl py-10">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton variant="avatar" width={64} height={64} />
            <Skeleton variant="text" width="30%" height={32} />
          </div>
          <Skeleton variant="image" width="100%" height={500} className="mb-6 rounded-xl" />
          <Skeleton variant="text" width="100%" height={24} className="mb-2" />
          <Skeleton variant="text" width="80%" height={20} className="mb-4" />
          <div className="flex gap-4">
            <Skeleton variant="rectangular" width={100} height={40} />
            <Skeleton variant="rectangular" width={100} height={40} />
            <Skeleton variant="rectangular" width={100} height={40} />
          </div>
        </main>
      </div>
    );
  }

  if (error || !sharedChallenge) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <p className="text-center text-red-500">
          {error || "Shared challenge not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Metadata 
        title={sharedChallenge?.challenge.name || "Shared Challenge"}
        description={sharedChallenge?.description || "View this creative challenge"}
        keywords={`${sharedChallenge?.challenge.category || ''}, shared challenge, creative`}
      />
      <HomeHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-7xl py-10">
        <div
          className="flex items-center gap-4 mb-6 cursor-pointer"
          onClick={handleProfileClick}
          style={{ cursor: isButtonDisabled ? 'not-allowed' : 'pointer', opacity: isButtonDisabled ? 0.6 : 1 }}
        >
          <Image
            src={getImageUrl(sharedChallenge.user.profilePicture)}
            alt="Profile"
            width={64}
            height={64}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => (e.currentTarget.src = "/imgs/default-profile.jpg")}
          />
          <span className="text-xl sm:text-2xl font-semibold text-[#2E2E38]">
            {sharedChallenge.user.firstName} {sharedChallenge.user.lastName}
          </span>
        </div>

        {sharedChallenge.images.length > 3 ? (
          <Carousel
            showArrows={true}
            showThumbs={false}
            showStatus={false}
            infiniteLoop={true}
            autoPlay={true}
            interval={5000}
            className="w-full relative mb-6"
          >
            {sharedChallenge.images.map((image, index) => (
              <div
                key={index}
                className="relative w-full rounded-xl overflow-hidden flex justify-center items-center"
              >
                <Image
                  src={getImageUrl(image)}
                  alt={`${sharedChallenge.challenge.name} Image ${index + 1}`}
                  width={800}
                  height={400}
                  className="w-auto max-w-full h-auto max-h-[500px] object-cover rounded-xl"
                  onError={(e) =>
                    (e.currentTarget.src = "/imgs/placeholder.png")
                  }
                />
              </div>
            ))}
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {sharedChallenge.images.map((image, index) => (
              <Image
                key={index}
                src={getImageUrl(image)}
                alt={`${sharedChallenge.challenge.name} Image ${index + 1}`}
                width={400}
                height={250}
                className="w-full h-64 sm:h-80 md:h-96 rounded-xl object-cover"
                onError={(e) => (e.currentTarget.src = "/imgs/placeholder.png")}
              />
            ))}
          </div>
        )}

        {/* إضافة اسم المشروع أعلى اسم التحدي */}
        {sharedChallenge.challenge.project && (
          <p className="text-2xl sm:text-3xl font-bold text-[#2E2E38] mb-4">
            {sharedChallenge.challenge.project.name}
          </p>
        )}
        <h2 className="text-xl sm:text-2xl text-[#2E2E38] mb-2">
          {sharedChallenge.challenge.name}
        </h2>

        <p className="text-sm sm:text-base text-[#2E2E38] mb-6">
          {sharedChallenge.description}
        </p>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={isButtonDisabled}
              className={`flex items-center gap-2 transition ${
                isLiked ? "text-red-500" : "text-[#2E2E38] hover:text-red-600"
              } ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FiHeart className={`text-lg ${isLiked ? "fill-red-500" : ""}`} />
              <span>{sharedChallenge.likes}</span>
            </button>
            <div className="flex items-center gap-2 text-[#2E2E38]">
              <FiMessageSquare className="text-lg" />
              <span>{comments.length}</span>
            </div>
            <div className="flex items-center gap-2 text-[#2E2E38]">
              <FiEye className="text-lg" />
              <span>{sharedChallenge.views}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleShareToLinkedIn}
              className="text-[#2E2E38] hover:text-[#A333FF] transition"
            >
              <FiLinkedin className="text-lg" />
            </button>
            <button
              onClick={handleCopyLink}
              className="text-[#2E2E38] hover:text-[#A333FF] transition"
            >
              <FiLink className="text-lg" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-[#2E2E38] mb-4">
            Comments
          </h3>
          {!isOwner && (
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none text-black resize-none h-24"
              />
              <button
                onClick={handleAddComment}
                className="mt-2 px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] transition"
              >
                Post Comment
              </button>
            </div>
          )}
          {comments.length === 0 ? (
            <p className="text-[#2E2E38]">No comments yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  id={`comment-${comment._id}`}
                  className="flex items-start gap-3 border-b border-gray-200 pb-3"
                >
                  <Image
                    src={getImageUrl(comment.user.profilePicture)}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) =>
                      (e.currentTarget.src = "/imgs/default-profile.jpg")
                    }
                  />
                  <div className="flex-1">
                    {comment.deletedAt ? (
                      <p className="text-gray-500 italic">
                        This comment has been deleted
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#2E2E38]">
                            {comment.user.firstName} {comment.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(comment.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-[#2E2E38] mt-1">
                          {comment.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => handleLikeComment(comment._id)}
                            disabled={isButtonDisabled || !!comment.deletedAt}
                            className={`flex items-center gap-2 transition ${
                              comment.isLiked
                                ? "text-red-500"
                                : "text-[#2E2E38] hover:text-red-600"
                            } ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <FiHeart
                              className={`text-sm ${
                                comment.isLiked ? "fill-red-500" : ""
                              }`}
                            />
                            <span>Like ({comment.likes})</span>
                          </button>
                          <button
                            onClick={() => handleReportComment(comment._id)}
                            disabled={comment.isReported || !!comment.deletedAt}
                            className={`transition ${
                              comment.isReported || !!comment.deletedAt
                                ? "text-red-500 cursor-not-allowed"
                                : "text-[#2E2E38] hover:text-red-500"
                            }`}
                          >
                            <FiFlag className="text-sm" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
};

export default SharedChallengeDetailsPage;
