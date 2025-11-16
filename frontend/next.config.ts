const nextConfig = {
  output: "standalone", // Required for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "streakup-backend.onrender.com",
        pathname: "/uploads/**", // صور المستخدمين في فولدر uploads
      },
    ],
  },
};

module.exports = nextConfig;
