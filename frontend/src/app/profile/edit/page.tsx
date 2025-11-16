"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import HomeHeader from "@/app/components/Home/HomeHeader";
import Image from "next/image";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { FiArrowLeft, FiUpload } from "react-icons/fi";
import Cropper, { Area } from "react-easy-crop";
import { Modal, Box, Button } from "@mui/material";
import { CroppedAreaPixels, getCroppedImg } from "./cropImage";
import { API_BASE_URL } from "@/config/api";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  track?: string;
  skillLevel?: string;
  profilePicture?: string;
}

interface ApiResponse {
  user: User;
  message?: string;
}

const EditProfilePage = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState("");
  const [level, setLevel] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `${API_BASE_URL}/api/auth/profile`,
          {
            withCredentials: true,
          }
        );
        const { user } = response.data;
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
        setTrack(user.track || "");
        setLevel(user.skillLevel || "");
        setProfileImage(
          user.profilePicture
            ? `${API_BASE_URL}/${user.profilePicture}`
            : null
        );
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast.error(
          axiosError.response?.data?.message || "Failed to load profile"
        );
        if (axiosError.response?.status === 401) {
          router.push("/login");
        }
      }
    };
    fetchUserProfile();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
        setCropModalOpen(true); // Open crop modal after upload
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCropSave = useCallback(async () => {
    if (!profileImage || !croppedAreaPixels) {
      toast.error("No image or crop area selected");
      return;
    }
    try {
      const croppedImage = await getCroppedImg(profileImage, croppedAreaPixels);
      const blob = await (await fetch(croppedImage)).blob();
      const croppedFile = new File([blob], file?.name || "profile.jpg", {
        type: blob.type,
      });
      setFile(croppedFile);
      setProfileImage(croppedImage);
      setCropModalOpen(false);
    } catch (err) {
      console.error("Error cropping image:", err);
      toast.error("Failed to crop image");
    }
  }, [profileImage, croppedAreaPixels, file]);

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("track", track);
    formData.append("skillLevel", level);
    if (file) formData.append("profilePicture", file);

    try {
      const response = await axios.put<ApiResponse>(
        `${API_BASE_URL}/api/auth/update-profile`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success(response.data.message || "Profile updated successfully!");
      router.push("/profile");
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />
      <div className="container mx-auto max-w-full px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-8 md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <FiArrowLeft
            className="text-xl cursor-pointer text-black hover:text-[#343131] transition"
            onClick={() => router.back()}
          />
          <h2 className="text-2xl font-bold text-black">Basic Information</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-start sm:items-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center mb-2">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  width={112}
                  height={112}
                />
              ) : (
                <Image
                  src="/imgs/default-profile.jpg"
                  alt="Default Profile"
                  className="w-full h-full object-cover"
                  width={112}
                  height={112}
                />
              )}
            </div>
            <label className="px-3 py-1 border border-purple-400 text-purple-500 rounded cursor-pointer hover:bg-purple-50 transition flex items-center gap-2">
              <FiUpload className="text-lg" />
              {profileImage ? "Change Photo" : "Upload Photo"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
              />
            </label>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#2E2E38] mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2E2E38] mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
                disabled={loading}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-[#2E2E38] mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2E2E38] mb-1">
                Your Track
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
                disabled={loading}
              >
                <option value="">Select Track</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Frontend Development">
                  Frontend Development
                </option>
                <option value="Backend Development">Backend Development</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2E2E38] mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 text-black"
                disabled={loading}
              >
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition disabled:bg-purple-300 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
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
          <div style={{ position: "relative", width: "100%", height: 300 }}>
            <Cropper
              image={profileImage || ""}
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
              sx={{ bgcolor: "#A333FF", "&:hover": { bgcolor: "#540099" } }}
            >
              Save Crop
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default EditProfilePage;
