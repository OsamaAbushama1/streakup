import { ReactNode } from "react";
import {
    FaFireAlt,
    FaTrophy,
    FaHandsHelping,
    FaStar,
    FaRocket,
} from "react-icons/fa";

export interface BadgeDef {
    name: string;
    level: string;
    icon: ReactNode;
    color: string;
    bgColor: string;
    description: string;
    check: (userData: {
        completedChallenges?: number;
        streak?: number;
        feedback?: number;
        appreciations?: number;
        points?: number;
        rank?: string;
    }) => boolean;
    showInBanner: boolean; // Whether to display in profile banner
}

export const ALL_BADGES: BadgeDef[] = [
    {
        name: "First Challenge",
        level: "Level 1",
        icon: <FaRocket />,
        color: "text-green-500",
        bgColor: "bg-green-100",
        description: "Complete your first challenge",
        check: (user) => (user.completedChallenges || 0) >= 1,
        showInBanner: false,
    },
    {
        name: "7 Day Streak",
        level: "Level 1",
        icon: <FaFireAlt />,
        color: "text-orange-500",
        bgColor: "bg-orange-100",
        description: "Maintain a streak of 7 days",
        check: (user) => (user.streak || 0) >= 7,
        showInBanner: false,
    },
    {
        name: "Community Helper",
        level: "Level 1",
        icon: <FaHandsHelping />,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        description: "Write 20 comments on shared challenges",
        check: (user) => (user.feedback || 0) >= 20,
        showInBanner: true, // ⭐ Show in banner
    },
    {
        name: "Social Star",
        level: "Level 1",
        icon: <FaStar />,
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        description: "Receive 20 likes on your shared challenges",
        check: (user) => (user.appreciations || 0) >= 20,
        showInBanner: true, // ⭐ Show in banner
    },
    {
        name: "30 Day Streak",
        level: "Level 1",
        icon: <FaFireAlt />,
        color: "text-red-500",
        bgColor: "bg-red-100",
        description: "Maintain a streak of 30 days",
        check: (user) => (user.streak || 0) >= 30,
        showInBanner: false,
    },
    {
        name: "Top Ranker",
        level: "Level 1",
        icon: <FaTrophy />,
        color: "text-purple-500",
        bgColor: "bg-purple-100",
        description: "Reach the highest rank (Platinum)",
        check: (user) => user.rank === "Platinum",
        showInBanner: true, // ⭐ Show in banner
    },
];

// Helper to get only badges that should show in banner
export const getBannerBadges = () => ALL_BADGES.filter((b) => b.showInBanner);

// Helper to get earned badges for a user
export const getEarnedBadges = (userData: {
    completedChallenges?: number;
    streak?: number;
    feedback?: number;
    appreciations?: number;
    points?: number;
    rank?: string;
}) => ALL_BADGES.filter((badge) => badge.check(userData));

// Helper to get earned banner badges for a user
export const getEarnedBannerBadges = (userData: {
    completedChallenges?: number;
    streak?: number;
    feedback?: number;
    appreciations?: number;
    points?: number;
    rank?: string;
}) => ALL_BADGES.filter((badge) => badge.showInBanner && badge.check(userData));
