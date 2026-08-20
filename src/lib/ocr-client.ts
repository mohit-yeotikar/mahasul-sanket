// Client-side OCR — free & unlimited, reads Marathi (Devanagari) + English via
// Tesseract (tessdata `mar`+`eng`). No API key, runs entirely in the browser.
//   • ocrImage — scanned photos / images.
//   • ocrPdf   — scanned PDFs: pdf.js renders each page to a canvas, Tesseract
//     reads it. The pdf.js worker is self-hosted at /public/pdf.worker.min.mjs
//     (kept in sync with the pdfjs-dist version).
//
// Heavy deps (tesseract.js ~ a few MB, pdfjs) are dynamically imported so they
// only load when a scan is actually processed.

export async function ocrImage(
  file: Blob,
  onProgress?: (pct: number) => void
): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("mar+eng", undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export async function ocrPdf(
  file: File,
  onProgress?: (page: number, total: number, pct: number) => void
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("mar+eng");

  try {
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 }); // upscale → better OCR
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      text += `${data.text}\n\n`;
      onProgress?.(i, pdf.numPages, Math.round((i / pdf.numPages) * 100));
      canvas.width = 0; // free memory
      canvas.height = 0;
    }
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
