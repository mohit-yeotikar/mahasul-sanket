"use client";

// L4 role management — list users in the admin's jurisdiction, change their
// role, and suspend / reactivate accounts. RLS + the server actions enforce
// that a district admin can only touch their own district (and limited roles).

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, UserRound, Ban, CheckCircle2, Phone } from "lucide-react";
import { Badge, Button, Card, Input, Select, Spinner } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { ROLE_LABELS } from "@/lib/i18n/dictionaries";
import type { UserRole } from "@/types";
import { setRoleAction, setUserStatusAction } from "./actions";

export interface ManagedUser {
  id: string;
  full_name: string;
  mobile: string;
  role: UserRole;
  status: string;
  taluka: { name_mr?: string; name_en?: string } | null;
}

const DISTRICT_ROLES: UserRole[] = ["talathi", "circle_officer", "nayab_tahsildar"];
const STATE_ROLES: UserRole[] = ["talathi", "circle_officer", "nayab_tahsildar", "dco", "district_admin", "state_admin", "super_admin"];

export function RoleManagement({ users, viewerRole }: { users: ManagedUser[]; viewerRole: UserRole }) {
  const { lang } = useLang();
  const M = lang === "mr";
  const [q, setQ] = useState("");

  const assignable = viewerRole === "district_admin" ? DISTRICT_ROLES : STATE_ROLES;
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => u.full_name.toLowerCase().includes(s) || u.mobile.includes(s));
  }, [q, users]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={M ? "नाव किंवा मोबाइलने शोधा…" : "Search by name or mobile…"} className="pl-9" />
      </div>

      {!filtered.length && <Card className="p-6 text-center text-sm text-muted">{M ? "वापरकर्ते आढळले नाहीत." : "No users found."}</Card>}

      <div className="space-y-2.5">
        {filtered.map((u) => (
          <UserRow key={u.id} u={u} assignable={assignable} M={M} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function UserRow({ u, assignable, M, lang }: { u: ManagedUser; assignable: UserRole[]; M: boolean; lang: "mr" | "en" }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const suspended = u.status === "suspended";

  // Ensure the current role is selectable even if outside the assignable set.
  const options = assignable.includes(u.role) ? assignable : [u.role, ...assignable];

  const changeRole = (role: string) =>
    start(async () => {
      const res = await setRoleAction(u.id, role);
      if (res.ok) { toast(M ? "भूमिका बदलली ✅" : "Role updated ✅", "success"); router.refresh(); }
      else toast(res.error ?? "Error", "error");
    });

  const toggleStatus = () =>
    start(async () => {
      const res = await setUserStatusAction(u.id, suspended ? "active" : "suspended");
      if (res.ok) { toast(suspended ? (M ? "खाते पुन्हा सक्रिय ✅" : "Reactivated ✅") : (M ? "खाते स्थगित" : "Suspended"), "success"); router.refresh(); }
      else toast(res.error ?? "Error", "error");
    });

  return (
    <Card className={`flex flex-wrap items-center gap-3 p-4 ${suspended ? "opacity-70" : ""}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UserRound className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          {u.full_name}
          {suspended && <Badge tone="danger">{M ? "स्थगित" : "Suspended"}</Badge>}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted">
          <a href={`tel:${u.mobile}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" aria-hidden />{u.mobile}</a>
          {u.taluka && <span>· {M ? u.taluka.name_mr : u.taluka.name_en}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={u.role} onChange={(e) => changeRole(e.target.value)} disabled={pending} className="w-44">
          {options.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]?.[lang] ?? r}</option>
          ))}
        </Select>
        <Button variant={suspended ? "secondary" : "outline"} size="sm" disabled={pending} onClick={toggleStatus}>
          {pending ? <Spinner className="h-4 w-4" /> : suspended ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Ban className="h-4 w-4" aria-hidden />}
          <span className="hidden sm:inline">{suspended ? (M ? "सक्रिय करा" : "Reactivate") : (M ? "स्थगित करा" : "Suspend")}</span>
        </Button>
      </div>
    </Card>
  );
}
