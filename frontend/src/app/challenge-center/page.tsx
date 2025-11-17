"use client";
import React, { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";
import { BsStar } from "react-icons/bs";
import HomeHeader from "../components/Home/HomeHeader";
import LandingFooter from "../components/Landing/LandingFooter";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  duration: number;
  points: number;
  previewImages: string[];
  status: "Active" | "Completed" | "Missed";
  project: Project | null;
}

const ChallengeCenter: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Challenges");
  const [selectedProject, setSelectedProject] =
    useState<string>("All Projects");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = API_BASE_URL;

  const getImageUrl = (
    path: string | undefined,
    fallback: string = "/imgs/default-challenge.jpg"
  ): string => {
    if (!path) return fallback;
    const normalized = path.trim();
    if (!normalized) return fallback;
    if (normalized.startsWith("http")) return normalized;
    return `${backendUrl}${
      normalized.startsWith("/") ? normalized : `/${normalized}`
    }`;
  };
  const tabs = ["All Challenges", "Active", "Completed", "Missed"] as const;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch challenges
        const challengeResponse = await fetch(`${backendUrl}/api/challenges`, {
          credentials: "include",
        });
        if (!challengeResponse.ok) {
          if (
            challengeResponse.status === 401 ||
            challengeResponse.status === 403
          ) {
            router.push("/login");
            return;
          }
          throw new Error(
            `Failed to fetch challenges: ${challengeResponse.statusText}`
          );
        }
        const challengeData = await challengeResponse.json();
        setChallenges(challengeData.challenges);

        // Fetch projects
        const projectResponse = await fetch(`${backendUrl}/api/auth/projects`, {
          credentials: "include",
        });
        if (!projectResponse.ok) {
          throw new Error(
            `Failed to fetch projects: ${projectResponse.statusText}`
          );
        }
        const projectData = await projectResponse.json();
        setProjects(projectData.projects);

        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // تصفية التحديات بناءً على التبويب النشط واسم المشروع
  const filteredChallenges = challenges.filter((challenge) => {
    const matchesTab =
      activeTab === "All Challenges" || challenge.status === activeTab;
    const matchesProject =
      selectedProject === "All Projects" ||
      (challenge.project && challenge.project._id === selectedProject);
    return matchesTab && matchesProject;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <section className="bg-white">
      <HomeHeader />
      <div className="container mx-auto xl:max-w-7xl px-4 sm:px-0 lg:px-0 mt-10 mb-10">
        <div className="text-left mb-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#000000]">
            Challenge Center
          </h2>
          <p className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base">
            Take on daily challenges and level up your creative skills
          </p>
        </div>

        <div className="flex flex-wrap mb-5 justify-between items-center gap-2">
          <div className="flex bg-[#B0B0B8] p-1 rounded-full">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-medium transition text-xs sm:text-sm md:text-base ${
                  activeTab === tab
                    ? "bg-[#F5F5F7] text-[#000000] shadow"
                    : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
                } ${index !== tabs.length - 1 ? "mr-1" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex bg-[#B0B0B8] p-1 rounded-full">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2 sm:px-4 py-1 sm:py-2 rounded-full font-medium transition text-xs sm:text-sm md:text-base bg-[#F5F5F7] text-[#000000] focus:outline-none"
            >
              <option value="All Projects">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {filteredChallenges.length === 0 ? (
            <p className="text-[#2E2E38] text-sm">
              No challenges available for this category or project.
            </p>
          ) : (
            filteredChallenges.map((challenge) => (
              <div
                key={challenge.challengeId}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 w-full sm:max-w-sm md:max-w-md lg:max-w-sm p-4 flex flex-col"
              >
                <div className="relative">
                  <Image
                    src={
                      challenge.previewImages &&
                      challenge.previewImages.length > 0
                        ? getImageUrl(challenge.previewImages[0])
                        : "/imgs/default-challenge.jpg"
                    }
                    alt={challenge.name || "Challenge Image"}
                    width={300}
                    height={192}
                    className="h-60 rounded-xl mb-4 object-cover w-full"
                  />
                  <span
                    className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-xl ${
                      challenge.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : challenge.status === "Completed"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {challenge.status}
                  </span>
                </div>

                <p className="text-[#2E2E38] text-sm font-medium">
                  {challenge.project ? challenge.project.name : "No Project"}
                </p>
                <h3 className="font-semibold text-[#000000] text-lg mt-1">
                  {challenge.challengeId}: {challenge.name}
                </h3>
                <p className="text-[#2E2E38] text-sm mt-1 mb-4">
                  {challenge.overview}
                </p>

                <div className="flex items-center text-gray-400 text-sm mb-4 space-x-4">
                  <div className="flex items-center gap-1">
                    <FiClock /> {challenge.duration} Days
                  </div>
                  <div className="flex items-center gap-1">
                    <BsStar /> {challenge.points} pts
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push(`/challenges/${challenge.challengeId}`)
                  }
                  className="bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium rounded-lg px-3 sm:px-4 py-2 sm:py-2 mt-auto flex items-center justify-center gap-2 transition-all text-xs sm:text-sm"
                >
                  View Details →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <LandingFooter />
    </section>
  );
};

export default ChallengeCenter;
