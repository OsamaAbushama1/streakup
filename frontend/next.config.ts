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
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || (isProd ? "https://streakup-backend.onrender.com" : "http://localhost:5000");

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
