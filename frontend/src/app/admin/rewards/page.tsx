"use client";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { FiLock, FiUnlock, FiCheckCircle } from "react-icons/fi";

const AdminRewards = () => {
    const [activeRewards, setActiveRewards] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const backendUrl = API_BASE_URL;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/admin/rewards/settings`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch settings");
                const data = await res.json();
                setActiveRewards(data.activeRewards || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [backendUrl]);

    const handleToggleReward = async (rewardName: string) => {
        try {
            setSuccessMessage(null);
            const newActiveRewards = activeRewards.includes(rewardName)
                ? activeRewards.filter(r => r !== rewardName)
                : [...activeRewards, rewardName];

            const res = await fetch(`${backendUrl}/api/admin/rewards/settings`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activeRewards: newActiveRewards }),
            });
            if (!res.ok) throw new Error("Failed to update settings");

            const data = await res.json();
            setActiveRewards(data.activeRewards);
            setSuccessMessage(
                activeRewards.includes(rewardName)
                    ? `${rewardName} locked successfully`
                    : `${rewardName} unlocked successfully`
            );

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update");
        }
    };

    const handleLockAll = async () => {
        try {
            setSuccessMessage(null);
            const res = await fetch(`${backendUrl}/api/admin/rewards/settings`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activeRewards: [] }),
            });
            if (!res.ok) throw new Error("Failed to update settings");

            const data = await res.json();
            setActiveRewards(data.activeRewards);
            setSuccessMessage("All rewards locked successfully");

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update");
        }
    };

    if (loading) return <div className="p-6">Loading settings...</div>;

    const rewards = [
        { name: "Highlight Shared Challenge", id: "highlight" },
        { name: "Streak Saver", id: "streak_saver" },
        { name: "Challenge Boost", id: "boost" },
    ];

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Rewards Management</h2>

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg border border-green-100 flex items-center gap-2">
                    <FiCheckCircle />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {rewards.map((reward) => {
                    const isActive = activeRewards.includes(reward.name);
                    return (
                        <div
                            key={reward.name}
                            className={`p-6 rounded-xl border-2 transition-all ${isActive
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                                }`}
                        >
                            <h3 className="font-semibold text-lg mb-2 text-gray-800">{reward.name}</h3>
                            <div className="flex items-center justify-between mt-4">
                                <span className={`flex items-center gap-2 text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"
                                    }`}>
                                    {isActive ? <FiUnlock /> : <FiLock />}
                                    {isActive ? "Unlocked" : "Locked"}
                                </span>

                                <button
                                    onClick={() => handleToggleReward(reward.name)}
                                    className={`px-4 py-2 text-white text-sm rounded-lg transition shadow-sm ${isActive
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-green-600 hover:bg-green-700"
                                        }`}
                                >
                                    {isActive ? "Lock" : "Unlock"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800">Global Lock</h3>
                        <p className="text-sm text-gray-600 mt-1">Lock all rewards immediately. Users will see "Coming Soon".</p>
                    </div>
                    <button
                        onClick={handleLockAll}
                        className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-sm flex items-center gap-2"
                    >
                        <FiLock />
                        Lock All Rewards
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminRewards;
