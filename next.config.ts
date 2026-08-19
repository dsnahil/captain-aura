import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root; without this Turbopack walks up and picks up an
  // unrelated lockfile from a parent directory.
  turbopack: { root: path.resolve(__dirname) },

  // No secrets are ever sent to the browser: provider keys are read only
  // inside route handlers under app/api.
  env: {},

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Location is requested explicitly in onboarding; camera is used for
          // closet photos on mobile. Everything else is denied.
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(self), microphone=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
