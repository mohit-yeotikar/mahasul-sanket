import { Badge } from "@/components/ui";

const TONE: Record<string, "neutral" | "primary" | "success" | "warning" | "danger" | "accent"> = {
  open: "accent",
  assigned: "primary",
  in_progress: "primary",
  waiting: "warning",
  resolved: "success",
  closed: "neutral",
  reopened: "danger",
};

const LABEL: Record<string, string> = {
  open: "खुले",
  assigned: "नियुक्त",
  in_progress: "प्रगतीत",
  waiting: "प्रतीक्षेत",
  resolved: "निराकरण",
  closed: "बंद",
  reopened: "पुन्हा उघडले",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return <Badge tone={TONE[status] ?? "neutral"}>{LABEL[status] ?? status}</Badge>;
}
