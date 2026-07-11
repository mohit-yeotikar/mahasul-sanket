"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  // Apply saved theme before paint side-effects (dark / high-contrast)
  useEffect(() => {
    const theme = localStorage.getItem("ms-theme");
    if (theme === "dark") document.documentElement.classList.add("dark");
    if (localStorage.getItem("ms-hc") === "1") document.documentElement.classList.add("hc");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ToastProvider>{children}</ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
