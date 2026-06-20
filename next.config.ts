import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "image.tmdb.org",
      "images.unsplash.com",
      "m.media-amazon.com",
      "ia.media-imdb.com",
      "img.omdbapi.com",
      "img.youtube.com"
    ],
  },

};

export default nextConfig;
