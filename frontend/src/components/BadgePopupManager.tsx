"use client";

import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
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

    if (!showPopup || !currentBadge) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center relative shadow-2xl transform transition-all scale-100 animate-fadeIn">
                <button
                    onClick={() => setShowPopup(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <FiX size={24} />
                </button>

                <div
                    className={`mx-auto w-24 h-24 ${currentBadge.bgColor} ${currentBadge.color} rounded-full flex items-center justify-center text-5xl mb-4 shadow-lg`}
                >
                    {currentBadge.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    🎉 Congratulations! 🎉
                </h3>
                <p className="text-lg font-semibold text-purple-600 mb-2">
                    {currentBadge.name}
                </p>
                <p className="text-gray-600 mb-6">{currentBadge.description}</p>

                <button
                    onClick={() => setShowPopup(false)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                    Awesome! 🚀
                </button>
            </div>
        </div>
    );
}
