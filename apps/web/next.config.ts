import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@permits/shared", "@permits/database"],
  webpack: (config) => {
    // Fix next-auth v4 CSS import issue with Next.js 15
    config.module.rules.push({
      test: /node_modules\/next-auth\/css\/index\.js$/,
      use: "null-loader",
    });
    return config;
  },
};

export default nextConfig;
