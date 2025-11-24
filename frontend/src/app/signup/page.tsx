"use client";
import React, { useState, useCallback, useEffect } from "react";
import { FiFigma, FiCode, FiUpload, FiUser } from "react-icons/fi";
import { FaPaintBrush } from "react-icons/fa";
import { Modal, Box, Button } from "@mui/material";
import Cropper, { Area } from "react-easy-crop";
import { CroppedAreaPixels, getCroppedImg } from "./cropImage";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "@/config/api";
import { Skeleton } from "../components/Skeleton";
import { useButtonDisable } from "../hooks/useButtonDisable";
import { Metadata } from "../components/Metadata/Metadata";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  track?: string;
  skillLevel?: string;
  profilePicture?: File | null;
};

interface Track {
  name: string;
  icon?: string; // حقل جديد لمسار الأيقونة
  description?: string;
}

const SignupForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    username: "",
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isButtonDisabled, handleButtonClick] = useButtonDisable();
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  // جلب الـ Tracks من الـ Backend
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/tracks`, {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch tracks");
        const data = await response.json();
        setTracks([
          { name: "UI/UX Design" },
          { name: "Graphic Design" },
          { name: "Frontend Development" },
          ...data.tracks, // إضافة الـ Tracks من الـ Backend
        ]);
      } catch (err) {
        console.error("Error fetching tracks:", err);
        // Tracks افتراضية في حالة الفشل
        setTracks([
          { name: "UI/UX Design" },
          { name: "Graphic Design" },
          { name: "Frontend Development" },
        ]);
      }
    };
    fetchTracks();
  }, []);

  const checkUsernameAvailability = async (username: string) => {
    if (!username) {
      setUsernameError("Username is required");
      return false;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/check-username?username=${encodeURIComponent(
          username
        )}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.message || "Username is already taken");
        return false;
      }
      setUsernameError("");
      return true;
    } catch (err) {
      setUsernameError("Error checking username availability");
      return false;
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    if (name === "username") {
      await checkUsernameAvailability(value);
    }
  };

  const handleTrackSelect = (track: string) => {
    setFormData((prev) => ({ ...prev, track }));
    setError("");
  };

  const handleSkillLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, skillLevel: e.target.value }));
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({ ...prev, profilePicture: file }));
      setImagePreview(URL.createObjectURL(file));
      setCropModalOpen(true);
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropSave = useCallback(async () => {
    if (!imagePreview || !croppedAreaPixels) {
      setError("No image or crop area selected");
      return;
    }
    try {
      const croppedImage = await getCroppedImg(imagePreview, croppedAreaPixels);
      const blob = await (await fetch(croppedImage)).blob();
      const croppedFile = new File(
        [blob],
        formData.profilePicture?.name || "profile.jpg",
        {
          type: blob.type,
        }
      );
      setFormData((prev) => ({ ...prev, profilePicture: croppedFile }));
      setImagePreview(croppedImage);
      setCropModalOpen(false);
    } catch (err) {
      console.error("Error cropping image:", err);
      setError("Failed to crop image");
    }
  }, [imagePreview, croppedAreaPixels, formData.profilePicture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.password ||
        !formData.username
      ) {
        setError("All fields are required.");
        return;
      }
      const isUsernameAvailable = await checkUsernameAvailability(
        formData.username
      );
      if (!isUsernameAvailable) {
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2 && !formData.track) {
      setError("Please select a track.");
      return;
    }

    if (step === 3 && !formData.skillLevel) {
      setError("Please select a skill level.");
      return;
    }

    handleButtonClick(async () => {
      setLoading(true);
      const body = new FormData();
      body.append("firstName", formData.firstName);
      body.append("lastName", formData.lastName);
      body.append("email", formData.email);
      body.append("password", formData.password);
      body.append("username", formData.username);
      if (formData.track) body.append("track", formData.track);
      if (formData.skillLevel) body.append("skillLevel", formData.skillLevel);
      if (formData.profilePicture)
        body.append("profilePicture", formData.profilePicture);

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          body,
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Registration failed");
        } else {
          console.log("Registered user:", data);
          window.location.href = "/home";
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleContinue = () => {
    if (step === 2 && formData.track) {
      setStep(3);
      setError("");
    }
  };

  // دالة لتحديد الأيقونة بناءً على اسم الـ Track
  const getTrackIcon = (trackName: string, isSelected: boolean) => {
    const track = tracks.find((t) => t.name === trackName);
    if (track?.icon) {
      return (
        <Image
          src={`${API_BASE_URL}${track.icon}`}
          alt={`${trackName} icon`}
          width={24}
          height={24}
          className="rounded-full object-cover"
        />
      );
    }
    switch (trackName) {
      case "UI/UX Design":
        return <FiFigma className={isSelected ? "text-black" : "text-white"} />;
      case "Graphic Design":
        return (
          <FaPaintBrush className={isSelected ? "text-black" : "text-white"} />
        );
      case "Frontend Development":
        return <FiCode className={isSelected ? "text-black" : "text-white"} />;
      default:
        return <FiUser className={isSelected ? "text-black" : "text-white"} />;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-center text-black mb-4">
              Join to the Streak Up Community
            </h1>
            <p className="text-center text-[#2E2E38] mb-6 text-lg">
              Start your Challenge journey to creative excellence
            </p>
            <div className="flex items-center justify-center mb-6">
              <span className="flex items-center gap-4">
                <span className="w-8 h-8 bg-[#A333FF] rounded-full flex items-center justify-center text-white font-bold">
                  1
                </span>
                <span className="border-b-2 border-[#A333FF] w-15"></span>
                <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                  2
                </span>
                <span className="border-b-2 border-gray-300 w-15"></span>
                <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                  3
                </span>
              </span>
            </div>
            <form
              onSubmit={handleSubmit}
              className="bg-white space-y-4 w-full max-w-lg p-6 rounded-xl"
            >
              <h3 className="text-base sm:text-lg font-semibold text-[#000000] mb-4">
                Basic Information
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-[#2E2E38] text-sm font-bold mb-2">
                    First Name
                  </label>
                  <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter Your First Name"
                      className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                      disabled={loading}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[#2E2E38] text-sm font-bold mb-2">
                    Last Name
                  </label>
                  <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter Your Last Name"
                      className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                      disabled={loading}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[#2E2E38] text-sm font-bold mb-2">
                  Username
                </label>
                <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter Your Username"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                    disabled={loading}
                    suppressHydrationWarning
                  />
                </div>
                {usernameError && (
                  <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                )}
              </div>
              <div>
                <label className="block text-[#2E2E38] text-sm font-bold mb-2">
                  Email Address
                </label>
                <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Your E-mail"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                    disabled={loading}
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#2E2E38] text-sm font-bold mb-2">
                  Password
                </label>
                <div className="p-[2px] rounded-lg bg-[#B0B0B8] focus-within:bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)] transition">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter Your Password"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none bg-white text-black placeholder-[#525050]"
                    disabled={loading}
                    suppressHydrationWarning
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full bg-[#A333FF] text-white py-3 rounded-lg hover:bg-[#540099] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                suppressHydrationWarning
                disabled={loading || isButtonDisabled || !!usernameError}
              >
                {loading || isButtonDisabled ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Continue →"
                )}
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-[#A333FF] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold text-center text-black mb-4">
              Join to the Streak Up Community
            </h1>
            <p className="text-center text-[#2E2E38] mb-6">
              Start your Challenge journey to creative excellence
            </p>
            <div className="flex items-center justify-center mb-6">
              <span className="flex items-center gap-4">
                <span className="w-8 h-8 bg-[#A333FF] rounded-full flex items-center justify-center text-white font-bold">
                  1
                </span>
                <span className="border-b-2 border-[#A333FF] w-15"></span>
                <span className="w-8 h-8 bg-[#A333FF] rounded-full flex items-center justify-center text-white font-bold">
                  2
                </span>
                <span className="border-b-2 border-[#A333FF] w-15"></span>
                <span className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                  3
                </span>
              </span>
            </div>
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-left text-black mb-4">
                Choose Your Track
              </h2>
              <p className="text-left text-[#2E2E38] mb-6">
                Select the creative field you want to focus on for the Challenge
              </p>
              <div
                className={`gap-4 mb-6 ${tracks.length % 2 === 0
                  ? "grid grid-cols-1 md:grid-cols-2"
                  : "grid grid-cols-1"
                  }`}
              >
                {tracks.map((track) => (
                  <button
                    key={track.name}
                    type="button"
                    onClick={() => handleTrackSelect(track.name)}
                    className="p-[2px] bg-white rounded-lg text-center border border-[#B0B0B8] hover:bg-gray-100 transition-colors"
                    style={
                      formData.track === track.name
                        ? {
                          background:
                            "linear-gradient(to right, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                          backgroundOrigin: "border-box",
                        }
                        : {}
                    }
                  >
                    <div className="flex flex-row items-center md:justify-start  space-x-2 bg-white rounded-lg h-full p-2">
                      <span
                        className={`text-xl rounded-full flex items-center justify-center p-2 transition ${formData.track === track.name
                          ? "text-black"
                          : "text-white bg-[#B0B0B8]"
                          }`}
                        style={
                          formData.track === track.name
                            ? {
                              background:
                                "linear-gradient(to right, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                            }
                            : {}
                        }
                      >
                        {getTrackIcon(
                          track.name,
                          formData.track === track.name
                        )}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-black">
                          {track.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-white text-[#A333FF] border-2 border-[#A333FF] rounded-lg hover:bg-[#A333FF] hover:text-white"
                  disabled={loading}
                  suppressHydrationWarning
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => handleButtonClick(() => handleContinue())}
                  className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#540099] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  suppressHydrationWarning
                  disabled={loading || isButtonDisabled || !formData.track}
                >
                  {loading || isButtonDisabled ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Continue →"
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-bold text-center text-black mb-4">
              Join to the Streak Up Community
            </h1>
            <p className="text-center text-[#2E2E38] mb-6">
              Start your Challenge journey to creative excellence
            </p>
            <div className="flex items-center justify-center mb-6">
              <span className="flex items-center gap-4">
                <span className="w-8 h-8 bg-[#A333FF] rounded-full flex items-center justify-center text-white font-bold">
                  1
                </span>
                <span className="border-b-2 border-[#A333FF] w-15"></span>
                <span className="w-8 h-8 bg-[#A333FF] rounded-full flex items-center justify-center text-white font-bold">
                  2
                </span>
                <span className="border-b-2 border-[#A333FF] w-15"></span>
                <span className="w-8 h-8 bg-[#A333FF] rounded-full flex items-center justify-center text-white font-bold">
                  3
                </span>
              </span>
            </div>
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-left text-[#000000] mb-4">
                What&apos;s your current skill level?
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    className="flex items-center border border-gray-300 rounded-lg"
                    style={
                      formData.skillLevel === "Beginner"
                        ? {
                          backgroundImage:
                            "linear-gradient(to right, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                          padding: "1px",
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box",
                        }
                        : {}
                    }
                  >
                    <div className="bg-white rounded-lg p-2 w-full flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-black">
                          Beginner
                        </span>

                      </div>
                      <div>
                        <input
                          type="radio"
                          name="skillLevel"
                          value="Beginner"
                          checked={formData.skillLevel === "Beginner"}
                          onChange={handleSkillLevelChange}
                          className="mr-2"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </label>
                  <label
                    className="flex items-center border border-gray-300 rounded-lg"
                    style={
                      formData.skillLevel === "Intermediate"
                        ? {
                          backgroundImage:
                            "linear-gradient(to right, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                          padding: "1px",
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box",
                        }
                        : {}
                    }
                  >
                    <div className="bg-white rounded-lg p-2 w-full flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-black">
                          Intermediate
                        </span>

                      </div>
                      <div>
                        <input
                          type="radio"
                          name="skillLevel"
                          value="Intermediate"
                          checked={formData.skillLevel === "Intermediate"}
                          onChange={handleSkillLevelChange}
                          className="mr-2"
                          disabled={loading}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  </label>
                  <label
                    className="flex items-center border border-gray-300 rounded-lg"
                    style={
                      formData.skillLevel === "Advanced"
                        ? {
                          backgroundImage:
                            "linear-gradient(to right, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
                          padding: "1px",
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box",
                        }
                        : {}
                    }
                  >
                    <div className="bg-white rounded-lg p-2 w-full flex items-center justify-between">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-black">
                          Advanced
                        </span>

                      </div>
                      <div>
                        <input
                          type="radio"
                          name="skillLevel"
                          value="Advanced"
                          checked={formData.skillLevel === "Advanced"}
                          onChange={handleSkillLevelChange}
                          className="mr-2"
                          disabled={loading}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  </label>
                </div>
                <div>
                  <label className="block text-[#2E2E38] text-sm font-bold mb-2">
                    Profile Picture (Optional)
                  </label>
                  <div className="flex items-center pl-0 pt-3 pr-3 pb-0 border border-none rounded-lg">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Profile Preview"
                        width={40}
                        height={40}
                        className="rounded-full object-cover mr-2"
                      />
                    ) : (
                      <span className="w-10 h-10 bg-[#B0B0B8] rounded-full flex items-center justify-center mr-2">
                        <FiUser className="text-2xl text-[#F5F5F7]" />
                      </span>
                    )}
                    <label className="cursor-pointer text-[#A333FF] hover:underline border font-semibold border-gray-300 rounded-lg p-2 flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                        suppressHydrationWarning
                      />
                      <FiUpload className="mr-2 text-xl" />
                      {imagePreview ? "Change Photo" : "Upload Photo"}
                    </label>
                  </div>
                </div>
                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-white text-[#A333FF] border-2 border-[#A333FF] rounded-lg hover:bg-[#A333FF] hover:text-white"
                    disabled={loading}
                    suppressHydrationWarning
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#A333FF] text-white rounded-lg hover:bg-[#540099] flex items-center justify-center"
                    disabled={loading}
                    suppressHydrationWarning
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      "Finish →"
                    )}
                  </button>
                </div>
              </form>
            </div>
            <Modal
              open={cropModalOpen}
              onClose={() => setCropModalOpen(false)}
              aria-labelledby="crop-modal-title"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: "90%", sm: 400 },
                  bgcolor: "white",
                  borderRadius: 2,
                  boxShadow: 24,
                  p: 4,
                }}
              >
                <h2 id="crop-modal-title" className="text-xl font-bold mb-4">
                  Crop Your Profile Picture
                </h2>
                <div
                  style={{ position: "relative", width: "100%", height: 300 }}
                >
                  <Cropper
                    image={imagePreview || ""}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={() => setCropModalOpen(false)}
                    variant="outlined"
                    color="error"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCropSave}
                    variant="contained"
                    sx={{
                      bgcolor: "#A333FF",
                      "&:hover": { bgcolor: "#540099" },
                    }}
                  >
                    Save Crop
                  </Button>
                </div>
              </Box>
            </Modal>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Metadata
        title="Sign Up"
        description="Create your StreakUp account and start your creative journey"
        keywords="sign up, register, creative challenges, StreakUp account"
      />
      <section className="min-h-screen bg-[#F4E5FF] flex items-center justify-center p-4 pt-8 md:pt-4">
        {renderStep()}
      </section>
    </>
  );
};

export default SignupForm;
