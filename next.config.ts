import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse / pdfjs-dist load a worker file via native require at runtime.
  // If Next bundles them into .next chunks, the worker path can't be resolved
  // ("Setting up fake worker failed"). Opt them out so they run from node_modules.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],

  // On Vercel (serverless), the worker is a dynamic import file-tracing can miss.
  // Force-include the pdfjs worker files in the routes that extract PDFs.
  outputFileTracingIncludes: {
    "/api/admin/bulk-ingest": ["./node_modules/pdfjs-dist/legacy/build/*.mjs"],
    "/api/ingest": ["./node_modules/pdfjs-dist/legacy/build/*.mjs"],
  },
};

export default nextConfig;
