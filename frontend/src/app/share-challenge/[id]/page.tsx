"use client";
import React, { useState, useEffect } from "react";
import HomeHeader from "../../components/Home/HomeHeader";
import { FiArrowLeft, FiShare2, FiUpload, FiTrash2 } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/config/api";
import { Skeleton } from "../../components/Skeleton";

interface Challenge {
  _id: string;
  challengeId: string;
  name: string;
  overview: string;
  category: string;
  status: "Active" | "Started" | "Completed" | "Missed";
  views: number;
  likes: number;
  duration: number;
  points: number;
  createdBy: { firstName: string; lastName: string };
}

interface ShareChallengePageProps {
  params: Promise<{ id: string }>;
}

const ShareChallengePage: React.FC<ShareChallengePageProps> = ({ params }) => {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = React.use(params);

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/challenges/${id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          if (response.status === 403) {
            const data = await response.json();
            setError(data.message || "Access denied");
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch challenge: ${response.statusText}`);
        }
        const data = await response.json();
        setChallenge(data.challenge);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching challenge:", err);
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [id, router, backendUrl]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files).filter(
        (file) => file.size <= 5 * 1024 * 1024
      );
      if (files.length !== event.target.files.length) {
        setError("Some files exceed 5MB and were ignored.");
      }
      const newImages = [...images, ...files];
      setImages(newImages);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      const files = Array.from(event.dataTransfer.files).filter(
        (file) => file.size <= 5 * 1024 * 1024
      );
      if (files.length !== event.dataTransfer.files.length) {
        setError("Some files exceed 5MB and were ignored.");
      }
      const newImages = [...images, ...files];
      setImages(newImages);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    setImagePreviews(
      imagePreviews.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleShare = async () => {
    if (!description.trim()) {
      setError("Please add a description before sharing.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true); // تفعيل التحميل
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append("description", description);
      images.forEach((image) => formData.append("images", image));

      const shareResponse = await fetch(
        `${backendUrl}/api/challenges/${id}/share`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!shareResponse.ok) {
        const errorData = await shareResponse.json();
        if (shareResponse.status === 401) {
          router.push("/login");
          return;
        }
        if (shareResponse.status === 403) {
          setError(
            errorData.message || "You are banned from sharing challenges"
          );
          return;
        }
        throw new Error(
          errorData.message ||
          `Failed to share challenge: ${shareResponse.statusText}`
        );
      }

      const shareData = await shareResponse.json();
      setSuccess(shareData.message); // "Challenge shared successfully"
      setTimeout(() => router.push(`/community-feed`), 1500); // Redirect after showing success
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error sharing challenge:", err);
    } finally {
      setIsSubmitting(false); // إعادة تمكين الزر في كل الأحوال
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white">
        <HomeHeader />
        <div className="container mx-auto px-4 py-10 xl:max-w-7xl">
          <Skeleton variant="text" width="40%" height={32} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={300} className="mb-6 rounded-lg" />
          <Skeleton variant="text" width="100%" height={24} className="mb-2" />
          <Skeleton variant="text" width="80%" height={20} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={150} className="rounded-lg" />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  if (!challenge)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-center text-[#2E2E38]">Challenge not found</p>
      </div>
    );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <HomeHeader />
      <main className="flex-1 container mx-auto px-4 xl:max-w-7xl mb-10 mt-8 bg-white">
        <h1 className="text-xl font-semibold text-[#2E2E38] mb-2">
          Share Your Challenge
        </h1>
        <p className="text-[#2E2E38] text-base mb-6">
          Tell the community what you created and show off your progress
        </p>

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-lg font-medium text-[#000000] mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none text-black"
            placeholder="Describe your progress or creation..."
          />
        </div>

        <div className="mb-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white hover:bg-gray-50 transition cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("imageUpload")?.click()}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-[#B0B0B8] text-white rounded-full w-12 h-12 flex items-center justify-center">
                <FiUpload size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-black mb-2">
              Upload Challenge Images
            </h3>
            <p className="text-[#84848b] text-base mb-4">
              Drag and drop your images here, or click to browse
            </p>
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="imageUpload"
              accept="image/jpeg,image/png,image/webp"
            />
            <label
              htmlFor="imageUpload"
              className="px-6 py-3 bg-[#A333FF] text-white rounded-lg hover:bg-[#9225e5] cursor-pointer transition inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Choose Files
            </label>
            <p className="text-[#84848b] text-sm mt-4">
              Supports: JPG, PNG, WebP (Max 5MB each)
            </p>
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      width={500}
                      height={200}
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-black mb-4">Guidelines</h2>
          <ul className="list-disc list-inside text-[#2E2E38] text-base space-y-2">
            <li>Ensure your content is relevant to the challenge.</li>
            <li>Upload high-quality images only.</li>
            <li>Respect community guidelines and avoid spam.</li>
            <li>Provide clear and concise descriptions.</li>
          </ul>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-white text-[#A333FF] border-2 border-[#A333FF] rounded-lg hover:bg-[#A333FF] hover:text-white transition flex items-center text-lg"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <button
            onClick={handleShare}
            disabled={isSubmitting} // تعطيل الزر
            className={`px-6 py-2 bg-[#A333FF] text-white rounded-lg transition flex items-center text-lg ${isSubmitting
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-[#9225e5]"
              }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sharing...
              </>
            ) : (
              <>
                <FiShare2 className="mr-2" /> Share Challenge
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ShareChallengePage;
