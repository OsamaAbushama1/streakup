"use client";
import React, { useState, useEffect } from "react";
import HomeHeader from "../../components/Home/HomeHeader";
import LandingFooter from "../../components/Landing/LandingFooter";
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiShare2,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { API_BASE_URL } from "@/config/api";

interface Project {
  _id: string;
  name: string;
  track: string;
}

interface Challenge {
  _id: string;
  challengeId: string;
  name: string;
  overview: string;
  challengeDetails: string;
  challengeSteps: string;
  requirements: string;
  duration: number;
  points: number;
  previewImages: string[];
  category: string;
  status: "Active" | "Started" | "Completed" | "Missed";
  createdAt: string;
  views: number;
  project: Project | null; // Added project field
}

interface ChallengeDetailsPageProps {
  params: Promise<{ id: string }>;
}

const ChallengeDetailsPage: React.FC<ChallengeDetailsPageProps> = ({
  params,
}) => {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeIndex, setChallengeIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = React.use(params);

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // التحقق من حالة تسجيل الدخول
        const authCheck = await fetch(`${backendUrl}/api/auth/check`, {
          method: "GET",
          credentials: "include",
        });
        if (!authCheck.ok) {
          console.log("User not authenticated, redirecting to login");
          router.push("/login");
          return;
        }

        // Fetch challenge details
        const response = await fetch(`${backendUrl}/api/challenges/${id}`, {
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push("/login");
            return;
          }
          throw new Error(`Failed to fetch challenge: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched challenge:", data.challenge);
        setChallenge(data.challenge);

        // Increment view count
        console.log(`Sending view request for challenge ${id}`);
        const viewRes = await fetch(`${backendUrl}/api/challenges/${id}/view`, {
          method: "POST",
          credentials: "include",
        });
        if (!viewRes.ok) {
          console.error(`Failed to increment view: ${viewRes.status}`);
        } else {
          const viewData = await viewRes.json();
          console.log(`View incremented successfully for challenge ${id}`);
          setChallenge((prev) =>
            prev
              ? {
                  ...prev,
                  views: viewData.views,
                }
              : prev
          );
        }

        // Fetch challenges for index
        const challengesResponse = await fetch(`${backendUrl}/api/challenges`, {
          credentials: "include",
        });
        if (!challengesResponse.ok) {
          if (
            challengesResponse.status === 401 ||
            challengesResponse.status === 403
          ) {
            router.push("/login");
            return;
          }
          throw new Error(
            `Failed to fetch challenges: ${challengesResponse.statusText}`
          );
        }
        const challengesData = await challengesResponse.json();
        const sortedChallenges = challengesData.challenges.sort(
          (a: Challenge, b: Challenge) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const index = sortedChallenges.findIndex(
          (c: Challenge) => c.challengeId === id
        );
        setChallengeIndex(index);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleAcceptChallenge = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/challenges/start/${id}`, {
        method: "PUT",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to start challenge");
      }
      setChallenge((prev) => (prev ? { ...prev, status: "Started" } : prev));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error starting challenge:", err);
    }
  };

  const handleShareChallenge = () => {
    router.push(`/share-challenge/${id}`);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A333FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;
  if (!challenge || challengeIndex === null)
    return <p className="text-center text-[#2E2E38]">Challenge not found</p>;

  const steps = challenge.challengeSteps
    .split("\n")
    .filter((step) => step.trim())
    .map((step, index) => ({
      step: `Step ${index + 1}`,
      desc: step.trim(),
    }));

  return (
    <div className="bg-white min-h-screen">
      <HomeHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-7xl mt-6 sm:mt-10 mb-10">
        {/* Project Name */}
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-left sm:text-left text-black">
          {challenge.project ? challenge.project.name : "No Project"}
        </p>
        {/* Title & Path */}
        <h1 className="text-[#2E2E38] text-xl sm:text-2xl mb-2 text-left">
          Challenge {challenge.challengeId}: {challenge.name}
        </h1>
        <p className="text-[#2E2E38] text-sm sm:text-base mb-6 text-left">
          {challenge.overview}
        </p>

        {/* Points & Duration & Views */}
        <div className="flex flex-row space-x-4 mb-8 justify-center">
          <div className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 sm:w-32 text-center">
            <span className="block text-[#A333FF] font-bold text-lg sm:text-xl">
              {challenge.points}
            </span>
            <span className="text-gray-500 text-xs sm:text-sm">Points</span>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 sm:w-32 text-center">
            <span className="block text-[#A333FF] font-bold text-lg sm:text-xl">
              {challenge.duration} Days
            </span>
            <span className="text-gray-500 text-xs sm:text-sm">Duration</span>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 sm:w-32 text-center">
            <span
              className={`block font-bold text-lg sm:text-xl ${
                challenge.status === "Active"
                  ? "text-green-600"
                  : challenge.status === "Started"
                  ? "text-yellow-600"
                  : challenge.status === "Completed"
                  ? "text-blue-600"
                  : "text-red-600"
              }`}
            >
              {challenge.status}
            </span>
            <span className="text-gray-500 text-xs sm:text-sm">Status</span>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-3 w-1/2 sm:w-32 text-center">
            <span className="block text-[#A333FF] font-bold text-lg sm:text-xl">
              {challenge.views}
            </span>
            <span className="text-gray-500 text-xs sm:text-sm">Views</span>
          </div>
        </div>

        {/* Challenge Details */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg sm:text-xl mb-2 text-black">
            Challenge Details
          </h2>
          <p className="text-[#2E2E38] text-sm sm:text-base">
            {challenge.challengeDetails}
          </p>
        </div>

        {/* عرض صور أو Challenge Steps بناءً على المسار */}
        <div className="mb-8">
          {challenge.category === "Frontend Development" ? (
            <div>
              <h2 className="font-semibold text-lg sm:text-xl mb-4 text-black">
                Challenge Preview
              </h2>
              {challenge.previewImages && challenge.previewImages.length > 0 ? (
                challenge.previewImages.length > 3 ? (
                  <Carousel
                    showArrows={true}
                    showThumbs={false}
                    showStatus={false}
                    infiniteLoop={true}
                    autoPlay={true}
                    interval={5000}
                    className="w-full relative"
                    renderArrowPrev={(onClickHandler, hasPrev) =>
                      hasPrev && (
                        <button
                          onClick={onClickHandler}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#A333FF] text-white rounded-full flex items-center justify-center z-10 text-sm hover:bg-[#9225e5] transition"
                        >
                          <FiChevronLeft size={14} />
                        </button>
                      )
                    }
                    renderArrowNext={(onClickHandler, hasNext) =>
                      hasNext && (
                        <button
                          onClick={onClickHandler}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#A333FF] text-white rounded-full flex items-center justify-center z-10 text-sm hover:bg-[#9225e5] transition"
                        >
                          <FiChevronRight size={14} />
                        </button>
                      )
                    }
                  >
                    {challenge.previewImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative w-full rounded-xl overflow-hidden flex justify-center items-center "
                      >
                        <Image
                          src={`${backendUrl}${image}`}
                          alt={`${challenge.name} Preview ${index + 1}`}
                          width={800}
                          height={400}
                          className="w-auto max-w-full h-auto max-h-[500px] object-cover rounded-xl"
                        />
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {challenge.previewImages.map((image, index) => (
                      <Image
                        key={index}
                        src={`${backendUrl}${image}`}
                        alt={`${challenge.name} Preview ${index + 1}`}
                        width={800}
                        height={400}
                        className="w-full h-64 sm:h-80 md:h-96 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                )
              ) : (
                <p className="text-red-500 text-sm sm:text-base">
                  No preview images available
                </p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="font-semibold text-lg sm:text-xl mb-4 text-black">
                Challenge Steps
              </h2>
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-[#A333FF] text-white flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-[#84848b] text-xs sm:text-sm">
                      {step.desc}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg sm:text-xl mb-2 text-black">
            Requirements
          </h2>
          <ul className="list-disc list-inside text-[#2E2E38] text-sm sm:text-base space-y-1">
            {challenge.requirements.split("\n").map((req, index) => (
              <li className="text-[#2E2E38]" key={index}>
                {req.trim()}
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/challenge-center")}
            className="w-1/2 sm:w-auto px-4 py-2 sm:px-6 sm:py-2 bg-white text-[#A333FF] border-2 border-[#A333FF] rounded-lg hover:bg-[#A333FF] hover:text-white text-sm sm:text-base flex items-center justify-center"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          {challenge.status === "Active" ? (
            <button
              onClick={handleAcceptChallenge}
              className="w-1/2 sm:w-auto px-4 py-2 sm:px-6 sm:py-2 bg-[#A333FF] hover:bg-[#9225e5] text-white rounded-lg text-sm sm:text-base transition"
            >
              Accept Challenge
            </button>
          ) : challenge.status === "Started" ? (
            <button
              onClick={handleShareChallenge}
              className="w-1/2 sm:w-auto px-4 py-2 sm:px-6 sm:py-2 bg-[#A333FF] hover:bg-[#9225e5] text-white rounded-lg text-sm sm:text-base flex items-center transition"
            >
              <FiShare2 className="mr-2" /> Share Challenge
            </button>
          ) : (
            <button
              className="w-1/2 sm:w-auto px-4 py-2 sm:px-6 sm:py-2 bg-gray-300 text-gray-600 rounded-lg text-sm sm:text-base cursor-not-allowed"
              disabled
            >
              {challenge.status}
            </button>
          )}
        </div>
      </div>
      <LandingFooter />
    </div>
  );
};

export default ChallengeDetailsPage;
