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
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
