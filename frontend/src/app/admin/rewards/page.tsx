"use client";
import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "@/config/api";
import { FiPlus, FiLock, FiUnlock, FiTrash2, FiEdit2 } from "react-icons/fi";

interface Reward {
    _id: string;
    name: string;
    description: string;
    points: number;
    isAvailable: boolean;
    isSystem: boolean;
    icon?: string;
}

const RewardsPage = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        points: 0,
        icon: "",
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchRewards = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/rewards`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setRewards(data.rewards);
            }
        } catch (error) {
            console.error("Failed to fetch rewards", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRewards();
    }, []);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_BASE_URL}/api/admin/rewards/${editingId}`
                : `${API_BASE_URL}/api/admin/rewards`;
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({ name: "", description: "", points: 0, icon: "" });
                setEditingId(null);
                fetchRewards();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (error) {
            console.error("Error saving reward", error);
        }
    };

    const toggleLock = async (reward: Reward) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/rewards/${reward._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAvailable: !reward.isAvailable }),
                credentials: "include",
            });
            if (res.ok) {
                fetchRewards();
            }
        } catch (error) {
            console.error("Error toggling lock", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this reward?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/rewards/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (res.ok) {
                fetchRewards();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (error) {
            console.error("Error deleting reward", error);
        }
    };

    const openEdit = (reward: Reward) => {
        setFormData({
            name: reward.name,
            description: reward.description,
            points: reward.points,
            icon: reward.icon || "",
        });
        setEditingId(reward._id);
        setShowModal(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Rewards Management</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: "", description: "", points: 0, icon: "" });
                        setShowModal(true);
                    }}
                    className="bg-[#A333FF] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8022cd]"
                >
                    <FiPlus /> Create New Reward
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Name</th>
                                <th className="p-4 font-semibold text-gray-600">Description</th>
                                <th className="p-4 font-semibold text-gray-600">Points</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rewards.map((reward) => (
                                <tr key={reward._id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{reward.name}</td>
                                    <td className="p-4 text-gray-600 max-w-xs truncate">{reward.description}</td>
                                    <td className="p-4 text-gray-600">{reward.points}</td>
                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${reward.isAvailable
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {reward.isAvailable ? "Active" : "Locked"}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button
                                            onClick={() => toggleLock(reward)}
                                            className={`p-2 rounded-lg ${reward.isAvailable
                                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                : "bg-green-100 text-green-600 hover:bg-green-200"
                                                }`}
                                            title={reward.isAvailable ? "Lock Reward" : "Unlock Reward"}
                                        >
                                            {reward.isAvailable ? <FiLock /> : <FiUnlock />}
                                        </button>
                                        <button
                                            onClick={() => openEdit(reward)}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                            title="Edit"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        {!reward.isSystem && (
                                            <button
                                                onClick={() => handleDelete(reward._id)}
                                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                                title="Delete"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingId ? "Edit Reward" : "Create New Reward"}
                        </h2>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#A333FF] focus:border-transparent"
                                    required
                                    disabled={!!editingId && rewards.find(r => r._id === editingId)?.isSystem}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#A333FF] focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points Cost</label>
                                <input
                                    type="number"
                                    value={formData.points}
                                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#A333FF] focus:border-transparent"
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#8022cd]"
                                >
                                    {editingId ? "Save Changes" : "Create Reward"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardsPage;
