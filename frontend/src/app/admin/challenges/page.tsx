"use client";
import React, { useState, useEffect } from "react";
import { FiEdit, FiTrash2, FiPlus, FiX, FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/config/api";
import { Skeleton, SkeletonCard } from "../../components/Skeleton";
import { Metadata } from "../../components/Metadata/Metadata";

interface Challenge {
  _id: string;
  name: string;
  category: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
  likes: number;
  comments: number;
  views: number;
  duration: number;
  points: number;
  participants: number;
  overview: string;
  challengeDetails: string;
  challengeSteps: string;
  requirements: string;
  previewImages: string[];
  project?: { _id: string; name: string };
}

interface Project {
  _id: string;
  name: string;
  track: string;
  projectType: string;
  points: number;
  challengeCount: number;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
}

interface Track {
  name: string;
  icon?: string;
}

interface FormData {
  _id?: string;
  name: string;
  category: string;
  duration: number;
  points: number;
  overview: string;
  challengeDetails: string;
  challengeSteps: string;
  requirements: string;
  previewImages?: string[];
  project?: string;
}

interface ProjectFormData {
  _id?: string;
  name: string;
  track: string;
  projectType: string;
  points: number;
}

const ChallengesManagement: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [tracks, setTracks] = useState<Track[]>([
    { name: "UI/UX Design" },
    { name: "Graphic Design" },
    { name: "Frontend Development" },
    { name: "Backend Development" },
  ]); // Tracks افتراضية مع إمكانية إضافة Tracks من الـ Backend
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [challengeFormData, setChallengeFormData] = useState<FormData>({
    name: "",
    category: "",
    duration: 1,
    points: 0,
    overview: "",
    challengeDetails: "",
    challengeSteps: "",
    requirements: "",
    previewImages: [],
    project: "",
  });
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    name: "",
    track: "",
    projectType: "",
    points: 0,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isNewChallenge, setIsNewChallenge] = useState(true);
  const [isNewProject, setIsNewProject] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/profile`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Unauthorized");
        const data = await response.json();
        if (data.user.role !== "Admin") {
          router.push("/");
          return;
        }

        // جلب التحديات
        const challengesResponse = await fetch(
          `${backendUrl}/api/admin/challenges`,
          { credentials: "include" }
        );
        if (!challengesResponse.ok)
          throw new Error("Failed to fetch challenges");
        const challengesData = await challengesResponse.json();
        setChallenges(challengesData.challenges);
        setFilteredChallenges(challengesData.challenges);

        // جلب المشاريع
        const projectsResponse = await fetch(
          `${backendUrl}/api/admin/projects`,
          { credentials: "include" }
        );
        if (!projectsResponse.ok) throw new Error("Failed to fetch projects");
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects);
        setFilteredProjects(projectsData.projects);

        // جلب الـ Tracks ودمجها مع الـ Tracks الافتراضية
        const tracksResponse = await fetch(`${backendUrl}/api/admin/tracks`, {
          credentials: "include",
        });
        if (!tracksResponse.ok) throw new Error("Failed to fetch tracks");
        const tracksData = await tracksResponse.json();

        // دمج الـ Tracks الافتراضية مع الـ Tracks المجلوبة، مع تجنب التكرار
        const defaultTracks = [
          { name: "UI/UX Design" },
          { name: "Graphic Design" },
          { name: "Frontend Development" },
          { name: "Backend Development" },
        ];
        const backendTracks = tracksData.tracks || [];
        const mergedTracks = [
          ...defaultTracks,
          ...backendTracks.filter(
            (backendTrack: Track) =>
              !defaultTracks.some(
                (defaultTrack) => defaultTrack.name === backendTrack.name
              )
          ),
        ];
        setTracks(mergedTracks);

        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
        router.push("/login");
      }
    };
    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    const filtered = challenges.filter(
      (challenge) =>
        challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChallenges(filtered);
  }, [searchQuery, challenges]);

  useEffect(() => {
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
        project.track.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projectSearchQuery, projects]);

  const openChallengeModal = async (challenge?: Challenge) => {
    if (challenge) {
      setIsNewChallenge(false);
      setChallengeFormData({
        _id: challenge._id,
        name: challenge.name,
        category: challenge.category,
        duration: challenge.duration,
        points: challenge.points,
        overview: challenge.overview,
        challengeDetails: challenge.challengeDetails,
        challengeSteps: challenge.challengeSteps,
        requirements: challenge.requirements,
        previewImages: challenge.previewImages,
        project: challenge.project?._id || "",
      });
      setSelectedFiles([]);
    } else {
      setIsNewChallenge(true);
      setChallengeFormData({
        name: "",
        category: "",
        duration: 1,
        points: 0,
        overview: "",
        challengeDetails: "",
        challengeSteps: "",
        requirements: "",
        previewImages: [],
        project: "",
      });
      setSelectedFiles([]);
    }
    setIsChallengeModalOpen(true);
    setFormError(null);
  };

  const openProjectModal = async (project?: Project) => {
    if (project) {
      setIsNewProject(false);
      setProjectFormData({
        _id: project._id,
        name: project.name,
        track: project.track,
        projectType: project.projectType,
        points: project.points,
      });
    } else {
      setIsNewProject(true);
      setProjectFormData({
        name: "",
        track: "",
        projectType: "",
        points: 0,
      });
    }
    setIsProjectModalOpen(true);
    setFormError(null);
  };

  const closeModal = () => {
    setIsChallengeModalOpen(false);
    setIsProjectModalOpen(false);
    setChallengeFormData({
      name: "",
      category: "",
      duration: 1,
      points: 0,
      overview: "",
      challengeDetails: "",
      challengeSteps: "",
      requirements: "",
      previewImages: [],
      project: "",
    });
    setProjectFormData({
      name: "",
      track: "",
      projectType: "",
      points: 0,
    });
    setSelectedFiles([]);
    setFormError(null);
  };

  const handleChallengeChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setChallengeFormData({
      ...challengeFormData,
      [name]:
        name === "duration" || name === "points" ? parseInt(value) || 0 : value,
    });
    setFormError(null);
  };

  const handleProjectChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProjectFormData({
      ...projectFormData,
      [name]: name === "points" ? parseInt(value) || 0 : value,
    });
    setFormError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setChallengeFormData((prev) => ({
      ...prev,
      previewImages: prev.previewImages?.filter((_, i) => i !== index) || [],
    }));
  };

  const validateChallengeForm = async (
    data: FormData
  ): Promise<string | null> => {
    if (!data.name.trim()) return "Challenge Title is required";
    if (!data.category) return "Category is required";
    if (data.duration < 1) return "Duration must be at least 1 day";
    if (data.points < 0) return "Points cannot be negative";
    if (!data.overview.trim()) return "Overview is required";
    if (!data.challengeDetails.trim()) return "Challenge Details is required";
    if (!data.challengeSteps.trim()) return "Challenge Steps is required";
    if (!data.requirements.trim()) return "Requirements is required";
    if (data.project) {
      try {
        // جلب البروجكت
        const projectResponse = await fetch(
          `${backendUrl}/api/admin/projects/${data.project}`,
          { credentials: "include" }
        );
        if (!projectResponse.ok) return "Failed to fetch project details";
        const project = await projectResponse.json();

        // جلب التحديات المرتبطة بالبروجكت
        const challengesResponse = await fetch(
          `${backendUrl}/api/admin/challenges/by-project?project=${data.project}`,
          { credentials: "include" }
        );
        if (!challengesResponse.ok) return "Failed to fetch challenges";
        const projectChallenges = await challengesResponse.json();

        // حساب مجموع نقاط التحديات الحالية
        const currentPoints = projectChallenges.challenges
          .filter((c: Challenge) => c._id !== data._id) // استثناء التحدي الحالي إذا كان تعديل
          .reduce((sum: number, c: Challenge) => sum + c.points, 0);

        // إضافة نقاط التحدي الجديد
        const totalPoints = currentPoints + data.points;

        // التحقق من عدد التحديات (يجب ألا يتجاوز 6)
        const challengeCount =
          projectChallenges.challenges.length + (isNewChallenge ? 1 : 0);
        if (challengeCount > 6) {
          return "Project cannot have more than 6 challenges";
        }

        // التحقق من أن مجموع النقاط لا يتجاوز نقاط البروجكت
        if (totalPoints > project.project.points) {
          return `Total challenge points (${totalPoints}) exceed project points (${project.project.points})`;
        }
      } catch (err: unknown) {
        return err instanceof Error ? err.message : "Unknown error";
      }
    }
    return null;
  };

  const validateProjectForm = (data: ProjectFormData): string | null => {
    if (!data.name.trim()) return "Project Name is required";
    if (!data.track) return "Track is required";
    if (!data.projectType) return "Project Type is required";
    if (data.points < 0) return "Points cannot be negative";
    return null;
  };

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = await validateChallengeForm(challengeFormData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("name", challengeFormData.name);
      submitData.append("category", challengeFormData.category);
      submitData.append("duration", challengeFormData.duration.toString());
      submitData.append("points", challengeFormData.points.toString());
      submitData.append("overview", challengeFormData.overview);
      submitData.append("challengeDetails", challengeFormData.challengeDetails);
      submitData.append("challengeSteps", challengeFormData.challengeSteps);
      submitData.append("requirements", challengeFormData.requirements);
      if (challengeFormData.project) {
        submitData.append("project", challengeFormData.project);
      }

      if (
        challengeFormData.previewImages &&
        challengeFormData.previewImages.length > 0
      ) {
        challengeFormData.previewImages.forEach((img) => {
          submitData.append("existingImages", img);
        });
      }

      selectedFiles.forEach((file) => {
        submitData.append("previewImages", file);
      });

      const url = isNewChallenge
        ? `${backendUrl}/api/admin/challenges`
        : `${backendUrl}/api/admin/challenges/${challengeFormData._id}`;
      const method = isNewChallenge ? "POST" : "PUT";
      const response = await fetch(url, {
        method,
        body: submitData,
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isNewChallenge ? "create" : "update"} challenge`
        );
      }

      const newChallenge = await response.json();

      if (isNewChallenge) {
        setChallenges([...challenges, newChallenge.challenge]);
        setFilteredChallenges([...filteredChallenges, newChallenge.challenge]);
      } else {
        setChallenges(
          challenges.map((c) =>
            c._id === challengeFormData._id
              ? { ...c, ...newChallenge.challenge }
              : c
          )
        );
        setFilteredChallenges(
          filteredChallenges.map((c) =>
            c._id === challengeFormData._id
              ? { ...c, ...newChallenge.challenge }
              : c
          )
        );
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateProjectForm(projectFormData);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      const submitData = {
        name: projectFormData.name,
        track: projectFormData.track,
        projectType: projectFormData.projectType,
        points: projectFormData.points,
      };

      const url = isNewProject
        ? `${backendUrl}/api/admin/projects`
        : `${backendUrl}/api/admin/projects/${projectFormData._id}`;
      const method = isNewProject ? "POST" : "PUT";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isNewProject ? "create" : "update"} project`
        );
      }

      const newProject = await response.json();

      if (isNewProject) {
        setProjects([...projects, newProject.project]);
        setFilteredProjects([...filteredProjects, newProject.project]);
      } else {
        setProjects(
          projects.map((p) =>
            p._id === projectFormData._id ? { ...p, ...newProject.project } : p
          )
        );
        setFilteredProjects(
          filteredProjects.map((p) =>
            p._id === projectFormData._id ? { ...p, ...newProject.project } : p
          )
        );
      }
      closeModal();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleChallengeDelete = async (challengeId: string) => {
    if (confirm("Are you sure you want to delete this challenge?")) {
      try {
        const response = await fetch(
          `${backendUrl}/api/admin/challenges/${challengeId}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to delete challenge");
        setChallenges(challenges.filter((c) => c._id !== challengeId));
        setFilteredChallenges(
          filteredChallenges.filter((c) => c._id !== challengeId)
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await fetch(
          `${backendUrl}/api/admin/projects/${projectId}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to delete project");
        setProjects(projects.filter((p) => p._id !== projectId));
        setFilteredProjects(
          filteredProjects.filter((p) => p._id !== projectId)
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
  };

  if (loading)
    return (
      <>
        <Metadata title="Challenges Management" description="Manage and create challenges" />
        <div className="min-h-screen bg-white w-full px-4 py-6">
          <Skeleton variant="text" width="40%" height={32} className="mb-2" />
          <Skeleton variant="text" width="60%" height={20} className="mb-6" />
          <Skeleton variant="rectangular" width="100%" height={400} className="rounded-lg mb-8" />
          <Skeleton variant="text" width="40%" height={32} className="mb-2" />
          <Skeleton variant="text" width="60%" height={20} className="mb-6" />
          <Skeleton variant="rectangular" width="100%" height={400} className="rounded-lg" />
        </div>
      </>
    );
  if (error)
    return <p className="text-center text-red-500 pt-20">Error: {error}</p>;

  return (
    <>
      <Metadata title="Challenges Management" description="Manage and create challenges to engage users" />
      <div className="min-h-screen bg-white w-full px-4 py-6">
      <div>
        {/* جدول التحديات */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Challenges Management
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6b6e] mb-4">
          Manage and create challenges to engage users and boost participation
          across various tracks.
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto flex-1">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg" />
            <input
              type="text"
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 md:w-80 pl-8 pr-4 py-2 border-none rounded-lg bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm focus:outline-none text-black"
            />
          </div>
          <button
            onClick={() => openChallengeModal()}
            className="bg-[#A333FF] text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-[#9225e5] transition w-full sm:w-auto"
          >
            <FiPlus size={20} />
            New Challenge
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto mb-8">
          <table className="w-full text-left text-xs sm:text-sm min-w-[600px]">
            <thead className="bg-[#F5F5F7] text-[#2E2E38] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Name</th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">
                  Category
                </th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">
                  Duration (Days)
                </th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Points</th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">
                  Participants
                </th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Project</th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {filteredChallenges.map((challenge) => (
                <tr key={challenge._id} className="border-b hover:bg-[#F9F9F9]">
                  <td className="py-3 px-2 sm:px-4 truncate max-w-[150px] sm:max-w-[200px]">
                    {challenge.name}
                  </td>
                  <td className="py-3 px-2 sm:px-4 truncate max-w-[120px] sm:max-w-[150px]">
                    {challenge.category}
                  </td>
                  <td className="py-3 px-2 sm:px-4">{challenge.duration}</td>
                  <td className="py-3 px-2 sm:px-4">{challenge.points}</td>
                  <td className="py-3 px-2 sm:px-4">
                    {challenge.participants}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    {challenge.project?.name || "None"}
                  </td>
                  <td className="py-3 px-2 sm:px-4 flex gap-2">
                    <button
                      onClick={() => openChallengeModal(challenge)}
                      className="text-[#A333FF] hover:text-[#9225e5]"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleChallengeDelete(challenge._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* جدول المشاريع */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
          Projects Management
        </h1>
        <p className="text-xs sm:text-sm text-[#6b6b6e] mb-4">
          Manage and create projects, each containing up to 6 challenges from
          the same track.
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="relative w-full sm:w-auto flex-1">
            <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#B0B0B8] text-lg" />
            <input
              type="text"
              placeholder="Search projects..."
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              className="w-full sm:w-64 md:w-80 pl-8 pr-4 py-2 border-none rounded-lg bg-[#F5F5F7] placeholder-[#B0B0B8] text-sm focus:outline-none text-black"
            />
          </div>
          <button
            onClick={() => openProjectModal()}
            className="bg-[#A333FF] text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-[#9225e5] transition w-full sm:w-auto"
          >
            <FiPlus size={20} />
            New Project
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[600px]">
            <thead className="bg-[#F5F5F7] text-[#2E2E38] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Name</th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Track</th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">
                  Project Type
                </th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Points</th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">
                  Challenges
                </th>
                <th className="py-3 px-2 sm:px-4 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {filteredProjects.map((project) => (
                <tr key={project._id} className="border-b hover:bg-[#F9F9F9]">
                  <td className="py-3 px-2 sm:px-4 truncate max-w-[150px] sm:max-w-[200px]">
                    {project.name}
                  </td>
                  <td className="py-3 px-2 sm:px-4 truncate max-w-[120px] sm:max-w-[150px]">
                    {project.track}
                  </td>
                  <td className="py-3 px-2 sm:px-4">{project.projectType}</td>
                  <td className="py-3 px-2 sm:px-4">{project.points}</td>
                  <td className="py-3 px-2 sm:px-4">
                    {project.challengeCount}/6
                  </td>
                  <td className="py-3 px-2 sm:px-4 flex gap-2">
                    <button
                      onClick={() => openProjectModal(project)}
                      className="text-[#A333FF] hover:text-[#9225e5]"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleProjectDelete(project._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نموذج التحدي */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative shadow-md">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#A333FF]">
              {isNewChallenge ? "New Challenge" : "Edit Challenge"}
            </h2>
            {formError && (
              <p className="text-red-500 text-xs sm:text-sm mb-4">
                {formError}
              </p>
            )}
            <form
              onSubmit={handleChallengeSubmit}
              className="space-y-4 text-black"
            >
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Challenge Title
                </label>
                <input
                  name="name"
                  value={challengeFormData.name}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Category
                </label>
                <select
                  name="category"
                  value={challengeFormData.category}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  required
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {tracks.map((track) => (
                    <option key={track.name} value={track.name}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Project (Optional)
                </label>
                <select
                  name="project"
                  value={challengeFormData.project}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                >
                  <option value="">No Project</option>
                  {projects
                    .filter(
                      (project) =>
                        !challengeFormData.category ||
                        project.track === challengeFormData.category
                    )
                    .map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name} ({project.challengeCount}/6)
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={challengeFormData.duration}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Points
                </label>
                <input
                  type="number"
                  name="points"
                  value={challengeFormData.points}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Overview
                </label>
                <textarea
                  name="overview"
                  value={challengeFormData.overview}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Challenge Details
                </label>
                <textarea
                  name="challengeDetails"
                  value={challengeFormData.challengeDetails}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Challenge Steps
                </label>
                <textarea
                  name="challengeSteps"
                  value={challengeFormData.challengeSteps}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Requirements
                </label>
                <textarea
                  name="requirements"
                  value={challengeFormData.requirements}
                  onChange={handleChallengeChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Preview Images (Optional, upload images)
                </label>
                <input
                  type="file"
                  name="previewImages"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm"
                />
                {challengeFormData.previewImages &&
                  challengeFormData.previewImages.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {challengeFormData.previewImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <Image
                            src={getImageUrl(img)}
                            alt="Preview"
                            width={60}
                            height={60}
                            className="object-cover rounded"
                          />
                          <button
                            onClick={() => removeExistingImage(idx)}
                            className="absolute top-0 right-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file: File, idx: number) => (
                      <div key={idx} className="relative">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt="New Preview"
                          width={60}
                          height={60}
                          className="object-cover rounded"
                          unoptimized
                        />
                        <button
                          onClick={() => removeFile(idx)}
                          className="absolute top-0 right-0 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-700 transition"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="bg-[#A333FF] text-white py-2 px-4 rounded-lg text-xs sm:text-sm hover:bg-[#9225e5] transition w-full sm:w-auto"
                >
                  {isNewChallenge ? "Create Challenge" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white text-[#A333FF] border border-[#A333FF] py-2 px-4 rounded-lg text-xs sm:text-sm hover:bg-[#A333FF] hover:text-white transition w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نموذج المشروع */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative shadow-md">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-[#A333FF]">
              {isNewProject ? "New Project" : "Edit Project"}
            </h2>
            {formError && (
              <p className="text-red-500 text-xs sm:text-sm mb-4">
                {formError}
              </p>
            )}
            <form
              onSubmit={handleProjectSubmit}
              className="space-y-4 text-black"
            >
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Project Name
                </label>
                <input
                  name="name"
                  value={projectFormData.name}
                  onChange={handleProjectChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Track
                </label>
                <select
                  name="track"
                  value={projectFormData.track}
                  onChange={handleProjectChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  required
                >
                  <option value="" disabled>
                    Select Track
                  </option>
                  {tracks.map((track) => (
                    <option key={track.name} value={track.name}>
                      {track.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Project Type
                </label>
                <select
                  name="projectType"
                  value={projectFormData.projectType}
                  onChange={handleProjectChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  required
                >
                  <option value="" disabled>
                    Select Project Type
                  </option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Website">Website</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs sm:text-sm font-semibold text-[#2E2E38]">
                  Points
                </label>
                <input
                  type="number"
                  name="points"
                  value={projectFormData.points}
                  onChange={handleProjectChange}
                  className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none"
                  min="0"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="bg-[#A333FF] text-white py-2 px-4 rounded-lg text-xs sm:text-sm hover:bg-[#9225e5] transition w-full sm:w-auto"
                >
                  {isNewProject ? "Create Project" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-white text-[#A333FF] border border-[#A333FF] py-2 px-4 rounded-lg text-xs sm:text-sm hover:bg-[#A333FF] hover:text-white transition w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ChallengesManagement;
