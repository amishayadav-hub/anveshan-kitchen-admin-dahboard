import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep firebase-admin (and its gRPC / native @google-cloud deps) out of the
  // bundler and load it as a real Node module at runtime.
  serverExternalPackages: ["firebase-admin", "@google-cloud/firestore"],
  // Vercel's serverless file-tracer can miss firebase-admin's dynamically-required
  // gRPC/@google-cloud files, so the function 500s at load ("Cannot find module").
  // Force the whole Admin-SDK dependency stack into every /api function.
  outputFileTracingIncludes: {
    "/api/**": [
      "./node_modules/firebase-admin/**",
      "./node_modules/@firebase/**",
      "./node_modules/@google-cloud/**",
      "./node_modules/@grpc/**",
      "./node_modules/google-gax/**",
      "./node_modules/google-auth-library/**",
      "./node_modules/gtoken/**",
      "./node_modules/google-logging-utils/**",
      "./node_modules/teeny-request/**",
      "./node_modules/protobufjs/**",
      "./node_modules/long/**",
      "./node_modules/jwks-rsa/**",
      "./node_modules/farmhash-modern/**",
      "./node_modules/jsonwebtoken/**",
      "./node_modules/node-forge/**",
    ],
  },
};

export default nextConfig;
