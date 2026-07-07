import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: do NOT add firebase-admin to serverExternalPackages. Externalizing it
  // makes the serverless runtime load it via raw require(), which crashes with
  // ERR_REQUIRE_ESM because firebase-admin/auth → jwks-rsa → jose is ESM-only.
  // Letting Next bundle firebase-admin resolves the ESM→CJS interop correctly.
  // (@grpc/grpc-js is pure JS, so bundling it is fine.)
};

export default nextConfig;
