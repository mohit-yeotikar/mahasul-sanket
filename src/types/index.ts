// Shared domain types — mirror of supabase/migrations schema.

export type UserRole =
  | "citizen"
  | "talathi"
  | "circle_officer"
  | "nayab_tahsildar"
  | "dco"
  | "district_admin"
  | "state_admin"
  | "super_admin";

export type AccountStatus = "pending_verification" | "active" | "suspended" | "rejected";

export type EscalationLevel = "L1" | "L2" | "L3" | "L4";

export type TicketStatus =
  | "open" | "assigned" | "in_progress" | "waiting"
  | "resolved" | "closed" | "reopened";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketCategory =
  | "mutation" | "seven_twelve" | "ferfar" | "crop_entry" | "inheritance"
  | "revenue" | "survey" | "map" | "certificates" | "digital_signature"
  | "technical_issue" | "others";

export type DocumentType = "gr" | "circular" | "faq" | "sop" | "notification" | "manual" | "other";

export interface Profile {
  id: string;
  full_name: string;
  mobile: string;
  government_id: string;
  role: UserRole;
  status: AccountStatus;
  district_id: string | null;
  taluka_id: string | null;
  village_id: string | null;
  preferred_lang: "mr" | "en" | "hi";
  avatar_url: string | null;
  created_at: string;
}

export interface Citation {
  document_id: string;
  title: string;
  page_number: number | null;
  gr_number: string | null;
  circular_number: string | null;
  department: string | null;
  issued_date: string | null;
  similarity: number;
}

export interface ChatAnswer {
  answer: string;
  confidence: number;
  citations: Citation[];
  related_questions: string[];
  escalation_suggested: boolean;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  current_level: EscalationLevel;
  created_by: string;
  assigned_to: string | null;
  district_id: string;
  sla_days: number | null;
  sla_due_at: string | null;
  ai_confidence: number | null;
  created_at: string;
}

/** Escalation ladder — L1 Talathi → L2 Nayab Tahsildar → L3 DCO → L4 District Admin */
export const LEVEL_ROLES: Record<EscalationLevel, UserRole[]> = {
  L1: ["talathi", "circle_officer"],
  L2: ["nayab_tahsildar"],
  L3: ["dco"],
  L4: ["district_admin"],
};

export const ROLE_LEVEL: Partial<Record<UserRole, EscalationLevel>> = {
  talathi: "L1",
  circle_officer: "L1",
  nayab_tahsildar: "L2",
  dco: "L3",
  district_admin: "L4",
};

export const NEXT_LEVEL: Record<EscalationLevel, EscalationLevel | null> = {
  L1: "L2",
  L2: "L3",
  L3: "L4",
  L4: null,
};
