const nextConfig = {
  output: 'standalone', // Required for Docker deployment
  images: {
    unoptimized: false, // Ensure image optimization is enabled
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.onrender.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "streakup-backend.onrender.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
