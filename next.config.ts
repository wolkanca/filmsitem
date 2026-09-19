import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,

  async rewrites() {
    return {
      beforeFiles: [
        {
          // Accept başlığında text/markdown içeren istekleri arka planda Markdown API handler'ına yönlendirir
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "accept",
              value: "(.*text/markdown.*)",
            },
          ],
          destination: "/api/markdown?path=:path*",
        },
      ],
    };
  },

  async redirects() {
    return [
      {
        source: "/list/drama",
        destination: "/genre/Drama",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        // Tüm sayfalara AI Agent keşif Link başlıklarını ekler
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value:
              '</.well-known/agent-card.json>; rel="service-desc"; type="application/json", </.well-known/agent-card.json>; rel="describedby"; type="application/json", </.well-known/agent-card.json>; rel="agent-card"; type="application/json"',
          },
        ],
      },
      {
        source: "/images/movies/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/css/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "text/css; charset=utf-8",
          },
        ],
      },
      {
        source: "/_next/static/chunks/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },

  images: {
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "alsetek.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;