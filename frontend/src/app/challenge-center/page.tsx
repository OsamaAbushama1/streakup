"use client";
import React, { useState, useEffect } from "react";
import { FiClock, FiChevronDown } from "react-icons/fi";
import { BsStar } from "react-icons/bs";
import HomeHeader from "../components/Home/HomeHeader";
import LandingFooter from "../components/Landing/LandingFooter";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/config/api";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";
import { Metadata } from "../components/Metadata/Metadata";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = API_BASE_URL;
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();

  const getImageUrl = (
    path: string | undefined,
    fallback: string = "/imgs/default-challenge.jpg"
  ): string => {
    if (!path) return fallback;
    const normalized = path.trim();
    if (!normalized) return fallback;
    if (normalized.startsWith("http")) return normalized;
    return `${backendUrl}${normalized.startsWith("/") ? normalized : `/${normalized}`
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
      <section className="bg-white">
        <HomeHeader />
        <div className="container mx-auto xl:max-w-7xl px-4 sm:px-0 lg:px-0 mt-10 mb-10">
          <Skeleton variant="text" width="40%" height={48} className="mb-4" />
          <Skeleton variant="text" width="60%" height={24} className="mb-6" />
          <SkeletonCard count={6} />
        </div>
      </section>
    );
  }
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <section className="bg-white">
      <Metadata
        title="Challenge Center"
        description="Browse and start creative challenges to level up your skills"
        keywords="challenges, creative challenges, skill development, StreakUp"
      />
      <HomeHeader />
      <div className="container mx-auto xl:max-w-7xl px-4 sm:px-0 lg:px-0 mt-10 mb-10">
        <div className="text-left mb-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#8981FA]">
            Challenge Center
          </h2>
          <p className="text-[#B0B0B8] mt-2 text-xs sm:text-sm md:text-base">
            Take on daily challenges and level up your creative skills
          </p>
        </div>

        <div className="flex flex-wrap mb-5 justify-between items-center gap-2">
          <div className="flex bg-[#B0B0B8] p-1 rounded-full">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-full font-medium transition text-xs sm:text-sm md:text-base ${activeTab === tab
                  ? "bg-[#F5F5F7] text-[#000000] shadow"
                  : "bg-transparent text-[#000000] hover:bg-[#e4e4ea]"
                  } ${index !== tabs.length - 1 ? "mr-1" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-3 rounded-full font-medium transition text-xs sm:text-sm md:text-base bg-[#ffffff] text-[#8981FA] focus:outline-none shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
            >
              <span>
                {selectedProject === "All Projects"
                  ? "All Projects"
                  : projects.find((p) => p._id === selectedProject)?.name ||
                  "All Projects"}
              </span>
              <FiChevronDown
                className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100">
                <div
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition"
                  onClick={() => {
                    setSelectedProject("All Projects");
                    setIsDropdownOpen(false);
                  }}
                >
                  All Projects
                </div>
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition"
                    onClick={() => {
                      setSelectedProject(project._id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {project.name}
                  </div>
                ))}
              </div>
            )}
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
                    className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-xl ${challenge.status === "Active"
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


                <div className="flex items-center justify-center gap-8 mb-6 mt-2">
                  <div className="text-center">
                    <p className="text-[#958EFA] text-lg font-bold">{challenge.duration}</p>
                    <p className="text-[#828282] text-xs">Days</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-[#E3309E] text-lg font-bold">{challenge.points}</p>
                    <p className="text-[#828282] text-xs">Point</p>
                  </div>
                </div>

                <button
                  onClick={() => handleButtonClick(() =>
                    router.push(`/challenges/${challenge.challengeId}`)
                  )}
                  disabled={isButtonDisabled}
                  className="w-full bg-[#8981FA] hover:bg-[#7c73e6] text-white font-semibold rounded-full py-3 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isButtonDisabled ? "Loading..." : "View Details"}
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
