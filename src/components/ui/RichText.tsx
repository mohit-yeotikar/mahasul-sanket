"use client";

// Lightweight, dependency-free renderer for AI answers.
// Supports the subset models actually emit: **bold**, bullet lists,
// numbered lists, and paragraphs. No raw HTML is ever injected.

import { Fragment } from "react";

function inline(text: string, keyBase: string): React.ReactNode[] {
  // **bold** → <strong>
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyBase}-b${i}`} className="font-semibold">{part}</strong>
    ) : (
      <Fragment key={`${keyBase}-t${i}`}>{part}</Fragment>
    )
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);

  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (!lines.length) return null;

        const isBullet = lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l.trim()));
        if (isBullet) {
          const ordered = /^\s*\d+[.)]/.test(lines[0].trim());
          const items = lines.map((l, li) => (
            <li key={li} className="ml-1">
              {inline(l.trim().replace(/^([-*•]|\d+[.)])\s+/, ""), `${bi}-${li}`)}
            </li>
          ));
          return ordered ? (
            <ol key={bi} className="my-2 list-decimal space-y-1.5 pl-5">{items}</ol>
          ) : (
            <ul key={bi} className="my-2 list-disc space-y-1.5 pl-5">{items}</ul>
          );
        }

        return (
          <p key={bi} className="my-2 first:mt-0 last:mb-0 leading-relaxed">
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
