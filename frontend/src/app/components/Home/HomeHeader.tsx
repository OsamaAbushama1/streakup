"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiBell, FiMenu } from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

interface Notification {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  type: "like" | "comment";
  message: string;
  createdAt: string;
  challengeLinkId: string;
  username: string | null;
  challenge: { name: string };
  read: boolean;
  commentId?: string | null; // جديد
  commentPreview?: string | null;
}

// دالة لتحويل التاريخ إلى نص ذكي
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 120) return "1 minute ago";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 7200) return "1 hour ago";
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return "yesterday";
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 1209600) return "1 week ago";
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const HomeHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] =
    useState(false);
  const [user, setUser] = useState<{
    profilePicture?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // جلب بيانات المستخدم
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setUser(data.user);
        } else {
          setError(data.message || "Failed to fetch user profile");
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Error fetching user profile");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // جلب الإشعارات
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/notifications`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        if (res.ok) {
          const formatted = data.notifications.map(
            (n: Notification & { comment?: { content: string } }) => ({
              ...n,
              challengeLinkId: n.challengeLinkId || null,
              challenge: { name: n.challenge?.name || "Unknown Challenge" },
              commentId: n.commentId || null, // جديد
              commentPreview: n.comment?.content
                ? n.comment.content.length > 30
                  ? n.comment.content.trim().substring(0, 30) + "..."
                  : n.comment.content.trim()
                : null,
            })
          );
          setNotifications(formatted);
          setUnreadCount(formatted.filter((n: Notification) => !n.read).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // إغلاق القوائم عند الكليك خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationsDropdownRef.current?.contains(target) ||
        profileDropdownRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsNotificationsDropdownOpen(false);
      setIsProfileDropdownOpen(false);
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // فتح/إغلاق الإشعارات + تحديث حالة القراءة
  const handleNotificationsClick = async () => {
    setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen);
    setIsProfileDropdownOpen(false);
    if (!isNotificationsDropdownOpen && unreadCount > 0) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/notifications/read`, {
          method: "PUT",
          credentials: "include",
        });
        setUnreadCount(0);
      } catch (error) {
        console.error("Failed to mark notifications as read");
      }
    }
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
    setIsNotificationsDropdownOpen(false);
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsNotificationsDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // Clear any client-side state
        setUser(null);
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsNotificationsDropdownOpen(false);
        // Force navigation and clear cache
        window.location.href = "/login";
      } else {
        console.error("Logout failed:", res.statusText);
        // Still try to navigate even if request fails
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error during logout:", error);
      // Navigate to login even on error
      window.location.href = "/login";
    }
  };

  const goToSharedChallenge = async (
    username: string | null,
    challengeId: string | null,
    commentId?: string | null
  ) => {
    if (!challengeId) return;

    let finalUsername = username;

    // لو مفيش username → نجيبه من الـ API
    if (!finalUsername) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/shared/username/${challengeId}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          finalUsername = data.username;
        }
      } catch (err) {
        console.error("Failed to fetch username:", err);
      }
    }

    if (!finalUsername) {
      alert("Challenge not found");
      return;
    }

    // احفظ commentId في localStorage
    if (commentId) {
      localStorage.setItem("scrollToComment", commentId);
    } else {
      localStorage.removeItem("scrollToComment");
    }

    router.push(`/${finalUsername}/${challengeId}`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <header className="bg-white p-4 border-b border-gray-300">
      <div className="container mx-auto xl:max-w-7xl flex justify-between items-center">
        {/* Logo */}
        <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full">
          <Image
            src="/imgs/streakupLogo.png"
            alt="Logo"
            width={48}
            height={48}
            className="object-contain w-full h-full"
          />
        </div>

        {/* Search + Icons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search Challenge, Creative..."
              className="px-8 py-2 w-40 sm:w-60 md:w-80 border-none rounded-lg focus:outline-none bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm sm:text-base text-black"
            />
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg sm:text-xl cursor-pointer" />
          </div>

          {/* Mobile Menu */}
          <div className="relative sm:hidden" ref={menuRef}>
            <FiMenu
              className="text-[#000000] text-xl cursor-pointer"
              onClick={handleMenuClick}
            />
            {isMenuOpen && (
              <div className="absolute -right-6 mt-6 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                <Link
                  href="/challenge-center"
                  className="p-2 flex items-center"
                >
                  <BsLightbulb className="text-[#000000] text-xl mr-2" />
                  <span className="text-[#000000] font-medium">Challenge</span>
                </Link>

                <div className="p-2 flex items-center relative">
                  <div className="relative">
                    <FiBell
                      className="text-[#000000] text-xl mr-2 cursor-pointer"
                      onClick={handleNotificationsClick}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-black cursor-pointer"
                    onClick={handleNotificationsClick}
                  >
                    Notifications
                  </span>
                </div>

                <div className="p-2 flex items-center relative">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-[#000000] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Image
                        src={
                          user?.profilePicture
                            ? `${API_BASE_URL}/${user.profilePicture}`
                            : "/imgs/default-profile.jpg"
                        }
                        alt="Profile"
                        width={24}
                        height={24}
                        className="rounded-full mr-2 cursor-pointer"
                        onClick={handleProfileClick}
                      />
                      <span
                        className="text-black cursor-pointer"
                        onClick={handleProfileClick}
                      >
                        Profile
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Icons */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/challenge-center"
              className="flex items-center space-x-1 bg-white text-[#000000] font-medium text-sm px-3 py-2 rounded-lg transition duration-200"
            >
              <BsLightbulb className="text-[#000000] text-xl" />
              <span>Challenge</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <div className="relative">
                <FiBell
                  className="text-[#000000] text-xl cursor-pointer"
                  onClick={handleNotificationsClick}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              {isNotificationsDropdownOpen && (
                <div
                  ref={notificationsDropdownRef}
                  className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 max-h-[320px] overflow-y-auto"
                >
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition ${
                          !notif.read ? "bg-blue-50" : ""
                        }`}
                        onClick={() =>
                          goToSharedChallenge(
                            notif.username,
                            notif.challengeLinkId,
                            notif.commentId
                          )
                        }
                      >
                        <div className="flex items-start gap-3">
                          <Image
                            src={
                              notif.sender.profilePicture
                                ? `${API_BASE_URL}/${notif.sender.profilePicture}`
                                : "/imgs/default-profile.jpg"
                            }
                            alt="Sender"
                            width={36}
                            height={36}
                            className="rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              <span className="font-semibold">
                                {notif.sender.firstName} {notif.sender.lastName}
                              </span>{" "}
                              {notif.type === "like" && notif.commentId
                                ? "liked your comment"
                                : notif.type === "like"
                                ? "liked your challenge"
                                : "commented on your challenge"}
                            </p>
                            {notif.commentPreview && (
                              <p className="text-xs text-gray-700 truncate mt-1 italic">
                                {notif.commentPreview}
                              </p>
                            )}
                            {notif.challenge?.name && !notif.commentId && (
                              <p className="text-xs text-blue-600 truncate mt-1">
                                {notif.challenge.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              {loading ? (
                <div className="w-8 h-8 border-2 border-[#000000] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Image
                    src={
                      user?.profilePicture
                        ? `${API_BASE_URL}/${user.profilePicture}`
                        : "/imgs/default-profile.jpg"
                    }
                    alt="Profile"
                    width={36}
                    height={36}
                    className="rounded-full cursor-pointer"
                    onClick={handleProfileClick}
                  />

                  {isProfileDropdownOpen && (
                    <div
                      ref={profileDropdownRef}
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
                    >
                      <Link href="/profile">
                        <div className="p-3 hover:bg-gray-100 cursor-pointer text-black text-sm">
                          Profile
                        </div>
                      </Link>
                      <div
                        className="p-3 hover:bg-gray-100 cursor-pointer text-black text-sm border-t"
                        onClick={handleLogout}
                      >
                        Logout
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Notifications Modal */}
      {isNotificationsDropdownOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 sm:hidden"
          onClick={() => setIsNotificationsDropdownOpen(false)}
        >
          <div
            className="absolute top-16 right-4 w-11/12 max-w-sm bg-white rounded-lg shadow-xl p-4 max-h-[320px] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-3">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No new notifications</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className="mb-3 pb-3 border-b last:border-0 cursor-pointer"
                  onClick={() => {
                    goToSharedChallenge(
                      notif.username,
                      notif.challengeLinkId,
                      notif.commentId
                    );
                    setIsNotificationsDropdownOpen(false);
                  }}
                >
                  <div className="flex gap-3">
                    <Image
                      src={
                        notif.sender.profilePicture
                          ? `${API_BASE_URL}/${notif.sender.profilePicture}`
                          : "/imgs/default-profile.jpg"
                      }
                      alt="Sender"
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <strong>{notif.sender.firstName}</strong>{" "}
                        {notif.type === "like" && notif.commentId
                          ? "liked your comment"
                          : notif.type === "like"
                          ? "liked your challenge"
                          : "commented on your challenge"}
                      </p>
                      {notif.commentPreview && (
                        <p className="text-xs text-gray-700 italic mt-1 truncate">
                          {notif.commentPreview}
                        </p>
                      )}
                      {notif.challenge?.name && !notif.commentId && (
                        <p className="text-xs text-blue-600 truncate mt-1">
                          {notif.challenge.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeHeader;
