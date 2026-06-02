import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    outputFileTracingRoot: process.cwd(),
    reactStrictMode: true,
    compress: true,           // gzip/brotli all responses
    poweredByHeader: false,   // remove X-Powered-By header

    images: {
        // Native Next.js image optimisation (removes unoptimized: true)
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30, // cache optimised images 30 days
        deviceSizes: [640, 768, 1024, 1280, 1536],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        remotePatterns: [
            // Firebase Storage
            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
                pathname: "/v0/b/**",
            },
            // Cloudinary (event/contestant images)
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
            // i-sabi production domains
            {
                protocol: "https",
                hostname: "*.i-sabi.com.ng",
                pathname: "/**",
            },
            // Render server CDN
            {
                protocol: "https",
                hostname: "i-sabi-server.onrender.com",
                pathname: "/**",
            },
            // Allow any HTTPS image (user-submitted form URLs)
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },

    // Security + caching headers
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Content-Type-Options",  value: "nosniff" },
                    { key: "X-Frame-Options",         value: "DENY" },
                    { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
            // Immutable cache for JS/CSS chunks (hash in filename)
            {
                source: "/_next/static/(.*)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
                ],
            },
            // 30-day cache for optimised images
            {
                source: "/_next/image(.*)",
                headers: [
                    { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
                ],
            },
        ];
    },
};

export default nextConfig;
