import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "महसूल संकेत — Mahasul Sanket",
    short_name: "महसूल संकेत",
    description: "महाराष्ट्र महसूल विभाग AI ज्ञान सहाय्यक",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#1a5c38",
    lang: "mr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
