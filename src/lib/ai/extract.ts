// Text extraction for the ingestion pipeline. One entry point,
// dispatched by file extension — add new formats here only.

export interface ExtractedPage {
  text: string;
  page: number | null;
}

export const SUPPORTED_EXTENSIONS = [
  "pdf", "txt", "md", "markdown", "docx", "csv", "tsv", "html", "htm", "json", "log",
] as const;

export function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isSupportedFile(name: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

/** Strip markdown syntax noise while keeping the readable content. */
function markdownToPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (b) => b.replace(/```\w*\n?|```/g, "")) // keep code content
    .replace(/^#{1,6}\s+/gm, "")            // headings
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")  // links → text
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // bold/italic
    .replace(/^\s*[-*+]\s+/gm, "• ")        // bullets
    .replace(/^\s*\|/gm, "")                 // table pipes (keep cells)
    .replace(/\|/g, " · ")
    .replace(/^[-=|\s:]{4,}$/gm, "");        // table/heading rules
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]{2,}/g, " ");
}

/** CSV/TSV → readable "header: value" rows so the AI can answer from tabular FAQs. */
function tableToPlain(raw: string, sep: string): string {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return raw;
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines
    .slice(1)
    .map((line) => {
      const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
      return headers.map((h, i) => (cells[i] ? `${h}: ${cells[i]}` : "")).filter(Boolean).join(" | ");
    })
    .join("\n");
}

/**
 * Extract readable text from an uploaded file.
 * Images are NOT handled here — they are OCR'd in the browser (Tesseract)
 * and arrive as ocrText instead.
 */
export async function extractText(file: File): Promise<ExtractedPage[]> {
  const ext = fileExtension(file.name);

  switch (ext) {
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
      const result = await parser.getText();
      return result.pages.map((p) => ({ text: p.text, page: p.num }));
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({
        buffer: Buffer.from(await file.arrayBuffer()),
      });
      return [{ text: value, page: null }];
    }
    case "md":
    case "markdown":
      return [{ text: markdownToPlain(await file.text()), page: null }];
    case "html":
    case "htm":
      return [{ text: htmlToPlain(await file.text()), page: null }];
    case "csv":
      return [{ text: tableToPlain(await file.text(), ","), page: null }];
    case "tsv":
      return [{ text: tableToPlain(await file.text(), "\t"), page: null }];
    case "json": {
      // Flatten JSON into "path: value" lines
      try {
        const obj = JSON.parse(await file.text());
        const lines: string[] = [];
        const walk = (v: unknown, path: string) => {
          if (v !== null && typeof v === "object") {
            for (const [k, val] of Object.entries(v)) walk(val, path ? `${path}.${k}` : k);
          } else {
            lines.push(`${path}: ${String(v)}`);
          }
        };
        walk(obj, "");
        return [{ text: lines.join("\n"), page: null }];
      } catch {
        return [{ text: await file.text(), page: null }];
      }
    }
    case "txt":
    case "log":
    default:
      return [{ text: await file.text(), page: null }];
  }
}
