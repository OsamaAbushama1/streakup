"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiBell, FiMenu } from "react-icons/fi";
import { BsLightbulb } from "react-icons/bs";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { API_BASE_URL } from "@/config/api";
import { useButtonDisable } from "../../hooks/useButtonDisable";
import { Skeleton } from "../Skeleton";

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
  commentId?: string | null;
  commentPreview?: string | null;
}

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
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
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
  const pathname = usePathname();
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();

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
          if (res.status === 401 || res.status === 403) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Error fetching user profile. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

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
              commentId: n.commentId || null,
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        notificationsDropdownRef.current?.contains(target) ||
        profileDropdownRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        mobileMenuRef.current?.contains(target)
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
        setUser(null);
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
        setIsNotificationsDropdownOpen(false);
        window.location.href = "/login";
      } else {
        console.error("Logout failed:", res.statusText);
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.href = "/login";
    }
  };

  const goToSharedChallenge = async (
    username: string | null,
    challengeId: string | null,
    commentId?: string | null
  ) => {
    await handleButtonClick(async () => {
      if (!challengeId) return;

      let finalUsername = username;

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

      if (commentId) {
        localStorage.setItem("scrollToComment", commentId);
      } else {
        localStorage.removeItem("scrollToComment");
      }

      router.push(`/${finalUsername}/${challengeId}`);
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <header className="bg-[#B0B0B8] p-4 border-b border-gray-300">
      <div className="container mx-auto xl:max-w-7xl flex items-center">
        {/* Logo - Far Left */}
        <Link href="/home" className="flex items-center">
          <Image
            src="/imgs/logo.png"
            alt="Challenge Logo"
            width={70}
            height={70}
            priority
            className="w-12 h-12 sm:w-12 sm:h-12 md:w-[45px] md:h-[45px] lg:w-[55px] lg:h-[55px] object-contain cursor-pointer"
          />
        </Link>

        {/* Center - Navigation Links */}
        <div className="flex-1 flex justify-center">
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/home"
              className={`flex items-center gap-2 px-4 py-2 font-medium text-base rounded-full transition ${pathname === '/home'
                ? 'bg-[#8981FA] text-white'
                : 'bg-transparent text-[#ffffff] hover:bg-[#8981FA] hover:text-white'
                }`}
            >
              {pathname === '/home' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              )}
              Home
            </Link>
            <Link
              href="/community-feed"
              className={`flex items-center gap-2 px-4 py-2 font-medium text-base rounded-full transition ${pathname === '/community-feed'
                ? 'bg-[#8981FA] text-white'
                : 'text-[#ffffff] hover:bg-[#8981FA] hover:text-white'
                }`}
            >
              {pathname === '/community-feed' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              )}
              Community
            </Link>
            <Link
              href="/challenge-center"
              className={`flex items-center gap-2 px-4 py-2 font-medium text-base rounded-full transition ${pathname === '/challenge-center'
                ? 'bg-[#8981FA] text-white'
                : 'text-[#ffffff] hover:bg-[#8981FA] hover:text-white'
                }`}
            >
              {pathname === '/challenge-center' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              )}
              Challenge Center
            </Link>
          </div>
        </div>

        {/* Right - Icons and Profile */}
        <div className="flex items-center space-x-2 sm:space-x-4">

          {/* Notifications Icon */}
          <div className="hidden sm:block relative">
            <div className="relative">
              <FiBell
                className="text-[#ffffff] text-xl cursor-pointer"
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
                      className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition ${!notif.read ? "bg-blue-50" : ""
                        }`}
                      onClick={() => goToSharedChallenge(
                        notif.username,
                        notif.challengeLinkId,
                        notif.commentId
                      )}
                      style={{ cursor: isButtonDisabled ? 'not-allowed' : 'pointer', opacity: isButtonDisabled ? 0.6 : 1 }}
                    >
                      <div className="flex items-start gap-3">
                        <Image
                          src={
                            notif.sender.profilePicture
                              ? notif.sender.profilePicture.startsWith("http")
                                ? notif.sender.profilePicture
                                : `${API_BASE_URL}/${notif.sender.profilePicture}`
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

          {/* User Profile with Dropdown */}
          <div className="hidden sm:block relative">
            {loading ? (
              <Skeleton variant="avatar" width={36} height={36} />
            ) : (
              <>
                <div className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-full transition bg-[#ffffff1a]" onClick={handleProfileClick}>
                  <Image
                    src={
                      user?.profilePicture
                        ? user.profilePicture.startsWith("http")
                          ? user.profilePicture
                          : `${API_BASE_URL}/${user.profilePicture}`
                        : "/imgs/default-profile.jpg"
                    }
                    alt="Profile"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                  <span className="text-[#ffffff] font-medium text-sm hidden md:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#ffffff] hidden md:block" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

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
                      className={`p-3 hover:bg-gray-100 cursor-pointer text-black text-sm border-t ${isButtonDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => handleButtonClick(() => handleLogout())}
                      style={{ pointerEvents: isButtonDisabled ? 'none' : 'auto' }}
                    >
                      {isButtonDisabled ? "Logging out..." : "Logout"}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Search Icon */}
          <div className="hidden sm:block">
            <FiSearch className="text-[#ffffff] text-xl cursor-pointer" />
          </div>

          {/* Mobile Menu */}
          <div className="relative sm:hidden" ref={menuRef}>
            <FiMenu
              className="text-[#ffffff] text-2xl cursor-pointer"
              onClick={handleMenuClick}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu Side Drawer */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            ref={mobileMenuRef}
            className="fixed top-0 bottom-0 right-0 w-3/4 bg-white shadow-xl h-full overflow-y-auto z-50 sm:hidden animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (removed) */}

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {/* Navigation Links */}
              <Link
                href="/home"
                className={`flex items-center gap-3 p-3 rounded-lg transition ${pathname === '/home'
                  ? 'bg-[#8981FA] text-white'
                  : 'hover:bg-gray-100 text-gray-900'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {pathname === '/home' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                )}
                <span className="font-medium">Home</span>
              </Link>

              <Link
                href="/community-feed"
                className={`flex items-center gap-3 p-3 rounded-lg transition ${pathname === '/community-feed'
                  ? 'bg-[#8981FA] text-white'
                  : 'hover:bg-gray-100 text-gray-900'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {pathname === '/community-feed' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                )}
                <span className="font-medium">Community</span>
              </Link>

              <Link
                href="/challenge-center"
                className={`flex items-center gap-3 p-3 rounded-lg transition ${pathname === '/challenge-center'
                  ? 'bg-[#8981FA] text-white'
                  : 'hover:bg-gray-100 text-gray-900'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {pathname === '/challenge-center' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                )}
                <span className="font-medium">Challenge Center</span>
              </Link>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Notifications Accordion */}
              <div>
                <div
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-900 select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileNotificationsOpen(!isMobileNotificationsOpen);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <FiBell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">Notifications</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${isMobileNotificationsOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Notifications List */}
                {isMobileNotificationsOpen && (
                  <div className="pl-4 pr-2 py-2 space-y-2 bg-gray-50 rounded-lg mt-1">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-2">No new notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-2 border-b last:border-0 cursor-pointer hover:bg-gray-100 rounded transition ${!notif.read ? "bg-blue-50" : ""}`}
                          onClick={() => {
                            goToSharedChallenge(
                              notif.username,
                              notif.challengeLinkId,
                              notif.commentId
                            );
                            setIsMenuOpen(false);
                          }}
                        >
                          <div className="flex gap-2">
                            <Image
                              src={
                                notif.sender.profilePicture
                                  ? notif.sender.profilePicture.startsWith("http")
                                    ? notif.sender.profilePicture
                                    : `${API_BASE_URL}/${notif.sender.profilePicture}`
                                  : "/imgs/default-profile.jpg"
                              }
                              alt="Sender"
                              width={24}
                              height={24}
                              className="rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                <span className="font-semibold">
                                  {notif.sender.firstName}
                                </span>{" "}
                                {notif.type === "like" ? "liked" : "commented"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {unreadCount > 0 && (
                      <button
                        className="w-full text-center text-xs text-blue-600 font-medium py-1 hover:underline"
                        onClick={handleNotificationsClick}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Accordion */}
              <div>
                <div
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-900 select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMobileProfileOpen(!isMobileProfileOpen);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {loading ? (
                      <Skeleton variant="avatar" width={20} height={20} />
                    ) : (
                      <Image
                        src={
                          user?.profilePicture
                            ? user.profilePicture.startsWith("http")
                              ? user.profilePicture
                              : `${API_BASE_URL}/${user.profilePicture}`
                            : "/imgs/default-profile.jpg"
                        }
                        alt="Profile"
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span className="font-medium">Profile</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${isMobileProfileOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Profile Options */}
                {isMobileProfileOpen && (
                  <div className="pl-11 pr-2 py-2 space-y-2 bg-gray-50 rounded-lg mt-1">
                    <Link
                      href="/profile"
                      className="block p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      View Profile
                    </Link>
                    <div
                      className={`block p-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (!isButtonDisabled) {
                          handleButtonClick(() => handleLogout());
                        }
                      }}
                    >
                      {isButtonDisabled ? 'Logging out...' : 'Logout'}
                    </div>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-900">
                <FiSearch className="h-5 w-5" />
                <span className="font-medium">Search</span>
              </div>
            </div>
          </div>
        </>
      )}

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
                  style={{ cursor: isButtonDisabled ? 'not-allowed' : 'pointer', opacity: isButtonDisabled ? 0.6 : 1 }}
                >
                  <div className="flex gap-3">
                    <Image
                      src={
                        notif.sender.profilePicture
                          ? notif.sender.profilePicture.startsWith("http")
                            ? notif.sender.profilePicture
                            : `${API_BASE_URL}/${notif.sender.profilePicture}`
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
