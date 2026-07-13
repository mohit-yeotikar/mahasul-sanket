import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse / pdfjs-dist load a worker file via native require at runtime.
  // If Next bundles them into .next chunks, the worker path can't be resolved
  // ("Setting up fake worker failed"). Opt them out so they run from node_modules.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
};

export default nextConfig;
