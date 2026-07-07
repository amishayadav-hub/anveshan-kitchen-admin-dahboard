import type { NextConfig } from "next";

// firebase-admin is pinned to v12 (see package.json). v13/14 pull
// jwks-rsa@4 → jose@6 (ESM-only), which crashes the Vercel serverless runtime
// with ERR_REQUIRE_ESM since Next externalizes firebase-admin and load()s it via
// require(). v12's chain uses jose@4 (CJS), which require() can load. Do not
// upgrade firebase-admin without confirming its jose dep still ships CJS.
const nextConfig: NextConfig = {};

export default nextConfig;
