"use client";

import { Card, Button } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/features/auth/components/LangToggle";

export default function SettingsPage() {
  const { t, lang } = useLang();

  const toggle = (cls: "dark" | "hc", key: string) => {
    const el = document.documentElement;
    el.classList.toggle(cls);
    localStorage.setItem(key, el.classList.contains(cls) ? (cls === "dark" ? "dark" : "1") : (cls === "dark" ? "light" : "0"));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t("settings")}</h1>
      <Card className="divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <p className="font-medium">{t("language")}</p>
          <LangToggle />
        </div>
        <div className="flex items-center justify-between p-4">
          <p className="font-medium">{t("darkMode")}</p>
          <Button variant="outline" size="sm" onClick={() => toggle("dark", "ms-theme")}>
            {lang === "mr" ? "बदला" : "Toggle"}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{lang === "mr" ? "उच्च कॉन्ट्रास्ट" : "High contrast"}</p>
            <p className="text-sm text-muted">{lang === "mr" ? "दृष्टी-सुलभतेसाठी" : "For visual accessibility"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toggle("hc", "ms-hc")}>
            {lang === "mr" ? "बदला" : "Toggle"}
          </Button>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">{t("notifications")}</p>
            <p className="text-sm text-muted">{lang === "mr" ? "ब्राउझर सूचना परवानगी" : "Browser notification permission"}</p>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => typeof Notification !== "undefined" && Notification.requestPermission()}
          >
            {lang === "mr" ? "परवानगी द्या" : "Allow"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
