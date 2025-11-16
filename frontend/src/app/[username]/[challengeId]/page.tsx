// app/[username]/[challengeId]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import HomeHeader from "@/app/components/Home/HomeHeader";
import LandingFooter from "@/app/components/Landing/LandingFooter";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import {
  FiHeart,
  FiMessageSquare,
  FiEye,
  FiLink,
  FiLinkedin,
  FiFlag,
} from "react-icons/fi";

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
    project: Project | null;
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

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const commentDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - commentDate.getTime()) / 1000
  );

  if (diffInSeconds < 60)
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30)
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

const SharedChallengeDetailsPage = ({
  params,
}: {
  params: Promise<{ username: string; challengeId: string }>;
}) => {
  const { username, challengeId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const commentIdFromUrl = searchParams.get("commentId");

  const [sharedChallenge, setSharedChallenge] =
    useState<SharedChallenge | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(
    null
  );

  const backendUrl = API_BASE_URL;

  const getImageUrl = (path: string | undefined): string => {
    if (!path) return "/imgs/default-profile.jpg";
    if (!path.startsWith("http")) {
      return `${backendUrl}${path.startsWith("/") ? path : `/${path}`}`;
    }
    return path;
  };

  // 1. Fetch challenge data + views + like status
  useEffect(() => {
    const fetchChallengeData = async () => {
      if (!username || !challengeId) {
        setError("Invalid URL");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get current user profile
        const profileRes = await fetch(`${backendUrl}/api/auth/profile`, {
          credentials: "include",
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCurrentUserId(profileData.user._id);
        }

        // Fetch shared challenge
        const challengeRes = await fetch(
          `${backendUrl}/api/shared/${username}/${challengeId}`,
          { credentials: "include" }
        );

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

        // Increment views
        const viewRes = await fetch(
          `${backendUrl}/api/shared/${challengeId}/view`,
          { method: "POST", credentials: "include" }
        );
        if (viewRes.ok) {
          const viewData = await viewRes.json();
          setSharedChallenge((prev) =>
            prev ? { ...prev, views: viewData.views } : prev
          );
        }

        // Get like status
        const likeStatusRes = await fetch(
          `${backendUrl}/api/shared/${challengeId}/like-status`,
          { credentials: "include" }
        );
        if (likeStatusRes.ok) {
          const likeData = await likeStatusRes.json();
          setIsLiked(likeData.isLiked);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Something went wrong");
        } else {
          setError("Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, [username, challengeId, router, currentUserId]);

  // 2. Fetch comments after sharedChallenge is loaded
  useEffect(() => {
    if (!sharedChallenge?._id) return;

    const fetchComments = async () => {
      try {
        const commentsRes = await fetch(
          `${backendUrl}/api/comments/shared/${sharedChallenge._id}`,
          { credentials: "include" }
        );

        if (commentsRes.ok) {
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
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      }
    };

    fetchComments();
  }, [sharedChallenge]);

  // Support scrollToComment from localStorage
  useEffect(() => {
    const fromStorage = localStorage.getItem("scrollToComment");
    const fromUrl = searchParams.get("commentId");

    const id = fromStorage || fromUrl;
    if (id) {
      setHighlightCommentId(id);
      localStorage.removeItem("scrollToComment"); // امسح بعد القراءة
    }
  }, [searchParams]);

  // Scroll and highlight comment
  useEffect(() => {
    if (loading || !comments.length || !highlightCommentId) return;
    const el = document.getElementById(`comment-${highlightCommentId}`);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 120, behavior: "smooth" });
      el.style.backgroundColor = "#fef3c7";
      el.style.transition = "background-color 0.5s";
      setTimeout(() => (el.style.backgroundColor = ""), 3000);
    }
  }, [loading, comments, highlightCommentId]);

  const handleLike = async () => {
    const res = await fetch(`${backendUrl}/api/shared/${challengeId}/like`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setIsLiked(data.isLiked);
      setSharedChallenge((prev) =>
        prev ? { ...prev, likes: data.likes } : prev
      );
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const res = await fetch(`${backendUrl}/api/comments/${commentId}/like`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, likes: data.likes, isLiked: data.isLiked }
            : c
        )
      );
    }
  };

  const handleReportComment = async (commentId: string) => {
    const res = await fetch(`${backendUrl}/api/comments/${commentId}/report`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, isReported: true } : c))
      );
      alert("Comment reported successfully");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return setError("Write a comment");
    if (newComment.trim().length > 500)
      return setError("Comment cannot exceed 500 characters");

    if (!sharedChallenge?._id) {
      setError("Challenge is still loading...");
      return;
    }

    const res = await fetch(
      `${backendUrl}/api/comments/shared/${sharedChallenge._id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
        credentials: "include",
      }
    );

    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [
        ...prev,
        { ...data.comment, isLiked: false, isReported: false, deletedAt: null },
      ]);
      setNewComment("");
      setError(null);
    } else {
      const err = await res.json();
      setError(err.message || "Failed to add comment");
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/${username}/${challengeId}`;
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  };

  const handleShareToLinkedIn = () => {
    const url = encodeURIComponent(
      `${window.location.origin}/${username}/${challengeId}`
    );
    const title = encodeURIComponent(
      sharedChallenge?.challenge.name || "Shared Challenge"
    );
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`;
    window.open(linkedInUrl, "_blank");
  };

  const handleProfileClick = () => {
    if (isOwner) {
      router.push("/profile");
    } else {
      router.push(`/profile/${sharedChallenge?.user.username}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A333FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !sharedChallenge) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-500 text-center">{error || "Page not found"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-7xl py-10">
        <div
          className="flex items-center gap-4 mb-6 cursor-pointer hover:opacity-80 transition"
          onClick={handleProfileClick}
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
            showArrows
            showThumbs={false}
            showStatus={false}
            infiniteLoop
            autoPlay
            interval={5000}
          >
            {sharedChallenge.images.map((img, i) => (
              <div key={i} className="flex justify-center">
                <Image
                  src={getImageUrl(img)}
                  alt={`Image ${i + 1}`}
                  width={800}
                  height={500}
                  className="rounded-xl object-cover max-h-[500px]"
                />
              </div>
            ))}
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {sharedChallenge.images.map((img, i) => (
              <Image
                key={i}
                src={getImageUrl(img)}
                alt={`Image ${i + 1}`}
                width={400}
                height={300}
                className="w-full h-64 sm:h-80 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

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
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition ${
                isLiked ? "text-red-500" : "text-[#2E2E38] hover:text-red-600"
              }`}
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
              <FiLink className="text-xl" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-[#2E2E38] mb-4">
            Comments
          </h3>

          {!isOwner && (
            <div className="mb-6">
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
                    alt="user"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    {comment.deletedAt ? (
                      <p className="text-gray-500 italic">
                        This comment was deleted
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#2E2E38]">
                            {comment.user.firstName} {comment.user.lastName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[#2E2E38] mt-1">
                          {comment.content}
                        </p>{" "}
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => handleLikeComment(comment._id)}
                            className={`flex items-center gap-2 transition ${
                              comment.isLiked
                                ? "text-red-500"
                                : "text-[#2E2E38] hover:text-red-600"
                            }`}
                            disabled={!!comment.deletedAt}
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
