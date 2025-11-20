'use client';

interface RewardCardProps {
    id: string;
    name: string;
    description: string;
    points: number;
    isAvailable: boolean;
    icon: string;
    category: string;
    userPoints: number;
    onRedeem?: (id: string) => void;
}

export default function RewardCard({
    id,
    name,
    description,
    points,
    isAvailable,
    icon,
    category,
    userPoints,
    onRedeem,
}: RewardCardProps) {
    const canAfford = userPoints >= points;
    const isLocked = !isAvailable;

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            boost: 'from-orange-500 to-red-500',
            utility: 'from-blue-500 to-cyan-500',
            cosmetic: 'from-pink-500 to-purple-500',
            special: 'from-yellow-500 to-orange-500',
        };
        return colors[cat] || 'from-purple-500 to-pink-500';
    };

    return (
        <div
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${isLocked
                    ? 'bg-gray-50 border-gray-300 opacity-70'
                    : canAfford
                        ? 'bg-white border-purple-400 hover:border-purple-600 hover:shadow-xl cursor-pointer transform hover:-translate-y-1'
                        : 'bg-white border-gray-300'
                }`}
            onClick={() => !isLocked && canAfford && onRedeem?.(id)}
        >
            {/* Lock Icon Overlay */}
            {isLocked && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <span className="text-sm">🔒</span>
                        Coming Soon
                    </div>
                </div>
            )}

            {/* Category Badge */}
            {!isLocked && (
                <div className="absolute top-4 right-4">
                    <div className={`bg-gradient-to-r ${getCategoryColor(category)} text-white px-3 py-1 rounded-full text-xs font-semibold capitalize`}>
                        {category}
                    </div>
                </div>
            )}

            {/* Icon */}
            <div className={`text-6xl mb-4 ${isLocked ? 'grayscale' : ''}`}>
                {icon}
            </div>

            {/* Content */}
            <h3 className={`text-2xl font-bold mb-2 ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                {name}
            </h3>

            <p className={`text-sm mb-6 min-h-[3rem] ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                {description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <span className={`text-3xl font-bold ${isLocked ? 'text-gray-400' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'}`}>
                        {points}
                    </span>
                    <span className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                        points
                    </span>
                </div>

                {!isLocked && (
                    <button
                        disabled={!canAfford}
                        className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${canAfford
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transform hover:scale-105'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {canAfford ? 'Redeem' : 'Insufficient'}
                    </button>
                )}
            </div>

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 bg-gray-200/30 rounded-2xl backdrop-blur-[1px]" />
            )}
        </div>
    );
}
