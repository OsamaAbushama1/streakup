'use client';

import { useState, useEffect } from 'react';
import RewardCard from '../components/RewardCard';
import { FiCheckCircle, FiLock } from 'react-icons/fi';

interface Badge {
    name: string;
    description: string;
    isUnlocked: boolean;
    unlockedAt: string | null;
    seen: boolean;
}

interface Reward {
    id: string;
    name: string;
    description: string;
    points: number;
    isAvailable: boolean;
    icon: string;
    category: string;
}

interface RewardsData {
    points: number;
    badges: Badge[];
    store: Reward[];
    newBadges: string[];
}

export default function RewardsSection() {
    const [activeTab, setActiveTab] = useState<'badges' | 'store'>('badges');
    const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/rewards`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setRewardsData(data);
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemReward = async (rewardId: string) => {
        const reward = rewardsData?.store.find(r => r.id === rewardId);
        if (!reward) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/redeem-reward`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rewardName: reward.name }),
            });

            if (response.ok) {
                const data = await response.json();
                alert(`${reward.name} redeemed successfully!`);
                // Refresh rewards data
                fetchRewards();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to redeem reward');
            }
        } catch (error) {
            console.error('Error redeeming reward:', error);
            alert('An error occurred while redeeming the reward');
        }
    };

    const getBadgeIcon = (badgeName: string) => {
        const icons: Record<string, string> = {
            'First Challenge': '🎯',
            '7 Day Streak': '🔥',
            'Community Helper': '🤝',
            'Social Star': '⭐',
            '30 Day Streak': '💪',
            'Top Ranker': '👑',
        };
        return icons[badgeName] || '🏆';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Points Display */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-1 rounded-2xl">
                <div className="bg-white rounded-2xl p-6 text-center">
                    <p className="text-gray-600 text-lg mb-2">Your Points Balance</p>
                    <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {rewardsData?.points || 0}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        Keep completing challenges to earn more points!
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b-2 border-gray-200">
                <button
                    onClick={() => setActiveTab('badges')}
                    className={`pb-3 px-6 font-semibold text-lg transition-all duration-300 relative ${activeTab === 'badges'
                            ? 'text-purple-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🏆 Badges
                    {activeTab === 'badges' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('store')}
                    className={`pb-3 px-6 font-semibold text-lg transition-all duration-300 relative ${activeTab === 'store'
                            ? 'text-purple-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    🛍️ Store
                    {activeTab === 'store' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600" />
                    )}
                </button>
            </div>

            {/* Badges Tab */}
            {activeTab === 'badges' && (
                <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">
                        Badges & Achievements
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewardsData?.badges.map((badge) => (
                            <div
                                key={badge.name}
                                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${badge.isUnlocked
                                        ? 'bg-white border-purple-400 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-50 border-gray-300 opacity-70'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-6xl mb-4">
                                        {badge.isUnlocked ? getBadgeIcon(badge.name) : '🔒'}
                                    </div>
                                    <h4 className="text-xl font-bold mb-2 text-gray-900">
                                        {badge.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {badge.description}
                                    </p>

                                    {badge.isUnlocked ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                            <FiCheckCircle className="text-xl" />
                                            <span className="text-sm font-semibold">Unlocked</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 text-gray-500">
                                            <FiLock className="text-xl" />
                                            <span className="text-sm font-semibold">Locked</span>
                                        </div>
                                    )}

                                    {badge.isUnlocked && badge.unlockedAt && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Store Tab */}
            {activeTab === 'store' && (
                <div>
                    <h3 className="text-2xl font-bold mb-6 text-gray-900">
                        Rewards Store
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewardsData?.store.map((reward) => (
                            <RewardCard
                                key={reward.id}
                                {...reward}
                                userPoints={rewardsData.points}
                                onRedeem={handleRedeemReward}
                            />
                        ))}
                    </div>

                    {(!rewardsData?.store || rewardsData.store.length === 0) && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">
                                No rewards available at the moment. Check back soon!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
