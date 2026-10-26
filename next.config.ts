import type { NextConfig } from "next";

const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Staff pages can't be framed by other sites (clickjacking).
      {
        source: "/((?!enquire|accommodation).*)",
        headers: [...baseHeaders, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Frame-Options", value: "DENY" }],
      },
      // The public forms can be embedded on the venue's own website only.
      {
        source: "/:path(enquire|accommodation)/:rest*",
        headers: [...baseHeaders, { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://queensgladstone.au https://*.queensgladstone.au" }],
      },
    ];
  },
};

export default nextConfig;
