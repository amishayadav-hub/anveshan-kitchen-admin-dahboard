import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin (and its gRPC / native @google-cloud deps) out of the
  // bundler and load it as a real Node module at runtime. Bundling it under
  // Turbopack breaks its dynamic requires and crashes every /api route that
  // uses the Admin SDK at runtime (500s on Vercel).
  serverExternalPackages: ["firebase-admin", "@google-cloud/firestore"],
};

export default nextConfig;
