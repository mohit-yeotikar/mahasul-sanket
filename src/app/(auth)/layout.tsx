import { LangToggle } from "@/features/auth/components/LangToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-surface-2 p-4">
      <div className="absolute right-4 top-4">
        <LangToggle />
      </div>
      <main className="w-full max-w-md">{children}</main>
      <footer className="mt-8 text-center text-xs text-muted">
        महाराष्ट्र शासन · महसूल व वन विभाग · Government of Maharashtra
      </footer>
    </div>
  );
}
