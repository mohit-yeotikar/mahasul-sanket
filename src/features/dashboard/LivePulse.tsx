"use client";

// Makes any dashboard LIVE: subscribes to database changes (tickets,
// notifications, profiles) and refreshes the page data automatically,
// with a pulsing indicator + "updated X ago" readout.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/i18n/LanguageProvider";

export function LivePulse() {
  const router = useRouter();
  const { lang } = useLang();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [, forceTick] = useState(0);
  const throttle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (throttle.current) return; // at most one refresh per 4s
      throttle.current = setTimeout(() => {
        throttle.current = null;
        router.refresh();
        setLastUpdate(new Date());
      }, 1200);
    };
    const channel = supabase
      .channel("live-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "knowledge_proposals" }, refresh)
      .subscribe();

    // re-render "X min ago" + periodic safety refresh every 60s
    const tick = setInterval(() => {
      forceTick((n) => n + 1);
    }, 30_000);
    const safety = setInterval(() => {
      router.refresh();
      setLastUpdate(new Date());
    }, 120_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(tick);
      clearInterval(safety);
      if (throttle.current) clearTimeout(throttle.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mins = Math.floor((Date.now() - lastUpdate.getTime()) / 60_000);
  const ago =
    mins < 1
      ? lang === "mr" ? "आत्ताच" : "just now"
      : lang === "mr" ? `${mins} मि. पूर्वी` : `${mins}m ago`;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      LIVE · {lang === "mr" ? "अद्ययावत" : "updated"} {ago}
    </span>
  );
}
