"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MessageSquareText, BookOpen, Ticket as TicketIcon,
  ShieldCheck, Users, BarChart3, Bell, Settings, ScrollText, Menu, X,
  Moon, Sun, Contrast, LogOut, Landmark, UserRound,
} from "lucide-react";
import { Button, cn } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { ROLE_LABELS, type DictKey } from "@/lib/i18n/dictionaries";
import type { Profile, UserRole } from "@/types";
import { logoutAction } from "@/features/auth/actions";
import { LangToggle } from "@/features/auth/components/LangToggle";
import { NotificationBell } from "@/features/notifications/NotificationBell";

interface NavItem {
  href: string;
  labelKey: DictKey;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[]; // undefined = everyone
}

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/chat", labelKey: "aiChat", icon: MessageSquareText },
  { href: "/knowledge", labelKey: "knowledgeBase", icon: BookOpen },
  { href: "/tickets", labelKey: "tickets", icon: TicketIcon },
  { href: "/dco", labelKey: "dcoPanel", icon: ShieldCheck, roles: ["nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"] },
  { href: "/admin", labelKey: "adminPanel", icon: Users, roles: ["district_admin", "state_admin", "super_admin", "dco"] },
  { href: "/reports", labelKey: "reports", icon: BarChart3, roles: ["dco", "district_admin", "state_admin", "super_admin"] },
  { href: "/audit", labelKey: "auditLogs", icon: ScrollText, roles: ["district_admin", "state_admin", "super_admin"] },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => !n.roles || n.roles.includes(profile.role));

  const toggleDark = () => {
    const el = document.documentElement;
    el.classList.toggle("dark");
    localStorage.setItem("ms-theme", el.classList.contains("dark") ? "dark" : "light");
  };
  const toggleHc = () => {
    const el = document.documentElement;
    el.classList.toggle("hc");
    localStorage.setItem("ms-hc", el.classList.contains("hc") ? "1" : "0");
  };

  const sidebar = (
    <nav aria-label="Main" className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-fg">
          <Landmark className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-bold leading-tight">{t("appName")}</p>
          <p className="text-xs text-muted">{ROLE_LABELS[profile.role]?.[lang]}</p>
        </div>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-fg"
                    : "hover:bg-surface-2 text-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border p-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
        >
          <UserRound className="h-5 w-5" aria-hidden />
          <span className="truncate">{profile.full_name}</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger hover:bg-surface-2"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            {t("logout")}
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-lg p-2 hover:bg-surface-2"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <LangToggle />
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label={t("darkMode")}>
            <Moon className="hidden h-5 w-5 dark:block" />
            <Sun className="h-5 w-5 dark:hidden" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleHc} aria-label="High contrast">
            <Contrast className="h-5 w-5" />
          </Button>
          <NotificationBell userId={profile.id} />
        </header>
        <main id="main" className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
