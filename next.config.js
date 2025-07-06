/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure appropriate Node.js APIs are available in Server Components
  // But use Edge Runtime for the auth middleware for better performance
  serverExternalPackages: ["@prisma/client", "@neondatabase/serverless"],
  // Edge runtime middleware configuration
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

module.exports = nextConfig;
