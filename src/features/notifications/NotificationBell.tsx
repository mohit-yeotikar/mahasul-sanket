"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  const { data: notifs } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,link,is_read,created_at")
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data as Notif[];
    },
  });

  // Realtime: new notifications appear instantly + browser notification
  useEffect(() => {
    const channel = supabase
      .channel("notif-" + userId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
          const n = payload.new as Notif;
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(n.title, { body: n.body ?? undefined });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unread = notifs?.filter((n) => !n.is_read).length ?? 0;

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${t("notifications")} (${unread})`}
        onClick={() => {
          setOpen((o) => !o);
          if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission();
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <Card className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-sm font-semibold">{t("notifications")}</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                ✓ ✓
              </button>
            )}
          </div>
          {!notifs?.length && <p className="p-4 text-center text-sm text-muted">—</p>}
          {notifs?.map((n) => (
            <Link
              key={n.id}
              href={n.link ?? "#"}
              onClick={() => setOpen(false)}
              className={cn(
                "block rounded-lg p-3 text-sm hover:bg-surface-2",
                !n.is_read && "bg-accent-soft"
              )}
            >
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs text-muted">{n.body}</p>}
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
