'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Reward {
    _id: string;
    name: string;
    description: string;
    points: number;
    isAvailable: boolean;
    icon: string;
    category: string;
}

export default function AdminRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        points: 0,
        icon: '🎁',
        category: 'utility',
        isAvailable: false,
    });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rewards`, {
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                router.push('/login');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setRewards(data.rewards);
            }
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingReward
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rewards/${editingReward._id}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rewards`;

            const method = editingReward ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert(editingReward ? 'Reward updated successfully!' : 'Reward created successfully!');
                setShowCreateModal(false);
                setEditingReward(null);
                setFormData({
                    name: '',
                    description: '',
                    points: 0,
                    icon: '🎁',
                    category: 'utility',
                    isAvailable: false,
                });
                fetchRewards();
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save reward');
            }
        } catch (error) {
            console.error('Error saving reward:', error);
            alert('An error occurred while saving the reward');
        }
    };

    const toggleAvailability = async (id: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/admin/rewards/${id}/toggle-availability`,
                {
                    method: 'PUT',
                    credentials: 'include',
                }
            );

            if (response.ok) {
                fetchRewards();
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    const deleteReward = async (id: string) => {
        if (!confirm('Are you sure you want to delete this reward?')) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/rewards/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                alert('Reward deleted successfully!');
                fetchRewards();
            }
        } catch (error) {
            console.error('Error deleting reward:', error);
        }
    };

    const openEditModal = (reward: Reward) => {
        setEditingReward(reward);
        setFormData({
            name: reward.name,
            description: reward.description,
            points: reward.points,
            icon: reward.icon,
            category: reward.category,
            isAvailable: reward.isAvailable,
        });
        setShowCreateModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Reward Management</h1>
                        <p className="text-gray-600 mt-2">Manage rewards and their availability</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingReward(null);
                            setFormData({
                                name: '',
                                description: '',
                                points: 0,
                                icon: '🎁',
                                category: 'utility',
                                isAvailable: false,
                            });
                            setShowCreateModal(true);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                    >
                        + Create Reward
                    </button>
                </div>

                {/* Rewards Grid */}
                <div className="grid gap-6">
                    {rewards.map((reward) => (
                        <div
                            key={reward._id}
                            className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="text-6xl">{reward.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900">{reward.name}</h3>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold capitalize">
                                                {reward.category}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-3">{reward.description}</p>
                                        <p className="text-purple-600 font-bold text-xl">{reward.points} points</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Availability Toggle */}
                                    <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-3 rounded-xl hover:bg-gray-100 transition">
                                        <input
                                            type="checkbox"
                                            checked={reward.isAvailable}
                                            onChange={() => toggleAvailability(reward._id)}
                                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className={`font-semibold ${reward.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                                            {reward.isAvailable ? '✅ Available' : '🔒 Coming Soon'}
                                        </span>
                                    </label>

                                    {/* Edit Button */}
                                    <button
                                        onClick={() => openEditModal(reward)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                                    >
                                        Edit
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => deleteReward(reward._id)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {rewards.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl">
                            <p className="text-gray-500 text-lg">No rewards created yet. Create your first reward!</p>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-3xl font-bold mb-6 text-gray-900">
                                {editingReward ? 'Edit Reward' : 'Create New Reward'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Reward Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Points Cost
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.points}
                                            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                            required
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Icon (Emoji)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-center text-3xl"
                                            required
                                            maxLength={2}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                    >
                                        <option value="utility">Utility</option>
                                        <option value="boost">Boost</option>
                                        <option value="cosmetic">Cosmetic</option>
                                        <option value="special">Special</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <label className="text-sm font-semibold text-gray-700">
                                        Make available immediately
                                    </label>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                                    >
                                        {editingReward ? 'Update Reward' : 'Create Reward'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setEditingReward(null);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
