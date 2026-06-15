import { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Check for presence of SSL certificates
const keyPath = path.resolve(__dirname, "certificates/localhost-key.pem");
const certPath = path.resolve(__dirname, "certificates/localhost.pem");
const httpsEnabled = fs.existsSync(keyPath) && fs.existsSync(certPath);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1 year - maximum cache duration
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizeCss: true,
    serverMinification: true,
    optimisticClientCache: true,
  },
  serverExternalPackages: ["sharp"],
  webpack: (config, { dev, isServer }) => {
    // Optimization for build
    if (!dev) {
      // Optimization settings for production
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
