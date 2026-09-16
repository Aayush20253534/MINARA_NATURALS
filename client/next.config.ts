import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "**.cdn.digitaloceanspaces.com", pathname: "/**" },
  { protocol: "https", hostname: "**.digitaloceanspaces.com", pathname: "/**" },
];

const configuredMediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL?.trim();
if (configuredMediaUrl) {
  try {
    const url = new URL(configuredMediaUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      remotePatterns.push({
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      });
    }
  } catch {
    // Invalid optional media URL should not make local Next.js configuration unusable.
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns },
};

export default nextConfig;
