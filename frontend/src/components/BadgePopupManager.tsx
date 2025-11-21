"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ALL_BADGES, BadgeDef } from "@/config/badges";
import { API_BASE_URL } from "@/config/api";

interface UserData {
    _id: string;
    completedChallenges?: number;
    streak?: number;
    feedback?: number;
    appreciations?: number;
    points?: number;
}

export default function BadgePopupManager() {
    const [showPopup, setShowPopup] = useState(false);
    const [currentBadge, setCurrentBadge] = useState<BadgeDef | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkForNewBadges = async () => {
            try {
                // Fetch current user profile
                const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    // User not logged in, skip badge check
                    return;
                }

                const data = await response.json();
                const userData: UserData = data.user;

                if (!userData?._id) return;

                // Get all earned badges
                const earnedBadges = ALL_BADGES.filter((badge) => badge.check(userData));

                // Get seen badges from localStorage (user-specific)
                const seenBadgesKey = `seenBadges_${userData._id}`;
                const seenBadges = JSON.parse(
                    localStorage.getItem(seenBadgesKey) || "[]"
                );

                // Find first unseen badge
                for (const badge of earnedBadges) {
                    if (!seenBadges.includes(badge.name)) {
                        setCurrentBadge(badge);
                        setShowPopup(true);

                        // Mark as seen
                        const updatedSeen = [...seenBadges, badge.name];
                        localStorage.setItem(seenBadgesKey, JSON.stringify(updatedSeen));
                        break; // Show one at a time
                    }
                }
            } catch (error) {
                console.error("Error checking badges:", error);
            }
        };

        // Check on mount
        checkForNewBadges();

        // Check periodically (every 10 seconds)
        const interval = setInterval(checkForNewBadges, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleViewBadges = () => {
        setShowPopup(false);
        router.push("/profile");
    };

    if (!showPopup || !currentBadge) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center relative shadow-2xl">
                {/* Badge Image */}
                <div className="mb-6">
                    <Image
                        src="/imgs/badge.png"
                        alt="Badge"
                        width={120}
                        height={120}
                        className="mx-auto"
                    />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    You&apos;ve earned a new badge!
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    Your badge appears in your profile achievements.
                </p>

                {/* View My Badges Button */}
                <button
                    onClick={handleViewBadges}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                    View My Badges
                </button>
            </div>
        </div>
    );
}
