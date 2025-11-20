"use client";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api";
import { FiLock, FiUnlock, FiLoader } from "react-icons/fi";

interface Reward {
    _id: string;
    name: string;
    description: string;
    points: number;
    isLocked: boolean;
    icon: string;
}

const AdminRewardsPage = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRewards = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/rewards`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch rewards");
            const data = await response.json();
            setRewards(data.rewards);
            setLoading(false);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    const toggleLock = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/rewards/${id}/lock`, {
                method: "PUT",
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to update reward");

            setRewards(rewards.map(r =>
                r._id === id ? { ...r, isLocked: !r.isLocked } : r
            ));
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><FiLoader className="animate-spin text-4xl text-purple-600" /></div>;
    if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Rewards</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                    <div key={reward._id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{reward.name}</h3>
                                <p className="text-sm text-gray-500">{reward.points} Points</p>
                            </div>
                            <div className={`p-2 rounded-full ${reward.isLocked ? "bg-red-100 text-red-500" : "bg-green-100 text-green-500"}`}>
                                {reward.isLocked ? <FiLock /> : <FiUnlock />}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-6 min-h-[40px]">{reward.description}</p>

                        <button
                            onClick={() => toggleLock(reward._id)}
                            className={`w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                ${reward.isLocked
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                        >
                            {reward.isLocked ? (
                                <>
                                    <FiUnlock /> Unlock Reward
                                </>
                            ) : (
                                <>
                                    <FiLock /> Lock Reward
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminRewardsPage;
