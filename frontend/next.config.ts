const nextConfig = {
  output: "standalone", // Required for Docker deployment
  images: {
    unoptimized: true, // Disable optimization for Cloudinary compatibility
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "streakup-backend.onrender.com",
        pathname: "/uploads/**", // Keep for backward compatibility
      },
    ],
  },
};

module.exports = nextConfig;
  