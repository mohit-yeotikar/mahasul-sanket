"use client";

// Greeting + today's date depend on the user's local clock, so they must
// be computed on the client only — otherwise the server (UTC) and browser
// (IST) disagree and React throws a hydration mismatch. Returns empty
// strings until mounted; components render a stable placeholder meanwhile.

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/dictionaries";

export function useGreeting(lang: Lang) {
  const [state, setState] = useState<{ greeting: string; today: string }>({
    greeting: "",
    today: "",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    const greeting =
      lang === "mr"
        ? hour < 12 ? "सुप्रभात" : hour < 17 ? "नमस्कार" : "शुभ संध्याकाळ"
        : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const today = new Date().toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    setState({ greeting, today });
  }, [lang]);

  return state;
}
