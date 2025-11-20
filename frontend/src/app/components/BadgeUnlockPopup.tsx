'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Badge {
    name: string;
    unlockedAt: string;
}

export default function BadgeUnlockPopup() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);

    useEffect(() => {
        fetchNewBadges();

        // Auto-dismiss after 5 seconds
        if (currentBadge) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentBadge]);

    const fetchNewBadges = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/badge-notifications`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.badges && data.badges.length > 0) {
                    setBadges(data.badges);
                    setCurrentBadge(data.badges[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching badge notifications:', error);
        }
    };

    const handleDismiss = async () => {
        if (!currentBadge) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/mark-badge-seen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ badgeName: currentBadge.name }),
            });

            // Show next badge or close
            const remainingBadges = badges.slice(1);
            if (remainingBadges.length > 0) {
                setBadges(remainingBadges);
                setCurrentBadge(remainingBadges[0]);
            } else {
                setBadges([]);
                setCurrentBadge(null);
            }
        } catch (error) {
            console.error('Error marking badge as seen:', error);
            // Still dismiss on error
            setCurrentBadge(null);
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

    return (
        <AnimatePresence>
            {currentBadge && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ scale: 0.5, y: -50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.5, y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                        className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-1 rounded-3xl shadow-2xl max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-3xl p-8 text-center relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                <div className="absolute top-4 left-4 text-6xl">✨</div>
                                <div className="absolute top-4 right-4 text-6xl">✨</div>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-6xl">🎉</div>
                            </div>

                            {/* Content */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="relative z-10"
                            >
                                <div className="text-8xl mb-4 animate-bounce">
                                    {getBadgeIcon(currentBadge.name)}
                                </div>

                                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                    Congratulations!
                                </h2>

                                <p className="text-xl text-gray-700 mb-6">
                                    You've unlocked the{' '}
                                    <span className="font-bold text-purple-600">
                                        {currentBadge.name}
                                    </span>{' '}
                                    badge!
                                </p>

                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleDismiss}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                                    >
                                        Awesome! 🎉
                                    </button>
                                </div>

                                {badges.length > 1 && (
                                    <p className="text-sm text-gray-500 mt-4">
                                        {badges.length - 1} more badge{badges.length > 2 ? 's' : ''} unlocked!
                                    </p>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
