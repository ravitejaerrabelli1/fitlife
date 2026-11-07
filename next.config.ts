import type { NextConfig } from "next";

const noReferrer = [{ key: "Referrer-Policy", value: "no-referrer" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/reset", headers: noReferrer },
      { source: "/reset/:token", headers: noReferrer },
    ];
  },
};

export default nextConfig;
