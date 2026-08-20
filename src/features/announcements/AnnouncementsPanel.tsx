"use client";

// Broadcasts — admins compose announcements (district or state-wide); all staff
// read the ones in scope. Delete is admin-only.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Send, Trash2, Globe2, MapPin } from "lucide-react";
import { Badge, Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { postAnnouncementAction, deleteAnnouncementAction } from "./actions";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  district_id: string | null;
  created_at: string;
}

export function AnnouncementsPanel({ items, canPost, canState }: { items: Announcement[]; canPost: boolean; canState: boolean }) {
  const { lang } = useLang();
  const M = lang === "mr";
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: "", body: "", scope: "district" as "district" | "state" });

  const post = () =>
    start(async () => {
      const res = await postAnnouncementAction(form);
      if (res.ok) {
        toast(M ? "घोषणा प्रसारित झाली 📢" : "Announcement broadcast 📢", "success");
        setForm({ title: "", body: "", scope: "district" });
        router.refresh();
      } else toast(res.error ?? "Error", "error");
    });

  const remove = (id: string) =>
    start(async () => {
      const res = await deleteAnnouncementAction(id);
      if (res.ok) { toast(M ? "हटवले" : "Deleted", "success"); router.refresh(); }
      else toast(res.error ?? "Error", "error");
    });

  const valid = form.title.trim().length >= 3 && form.body.trim().length >= 5;

  return (
    <div className="space-y-5">
      {canPost && (
        <Card className="space-y-3 border-primary/20 bg-primary/[0.03] p-5">
          <p className="flex items-center gap-2 font-semibold"><Megaphone className="h-4 w-4 text-primary" aria-hidden />{M ? "नवीन घोषणा" : "New announcement"}</p>
          <Field label={M ? "शीर्षक" : "Title"} required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={M ? "मजकूर" : "Message"} required>
            <Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{M ? "व्याप्ती" : "Scope"}</span>
              <Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as "district" | "state" })} className="w-48">
                <option value="district">{M ? "माझा जिल्हा" : "My district"}</option>
                {canState && <option value="state">{M ? "संपूर्ण राज्य" : "State-wide"}</option>}
              </Select>
            </label>
            <Button disabled={!valid || pending} onClick={post}>
              {pending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden />}
              {M ? "प्रसारित करा" : "Broadcast"}
            </Button>
          </div>
        </Card>
      )}

      {!items.length && (
        <Card className="p-8 text-center text-sm text-muted">{M ? "सध्या कोणतीही घोषणा नाही." : "No announcements yet."}</Card>
      )}

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  <Badge tone={a.district_id ? "primary" : "accent"}>
                    {a.district_id ? <MapPin className="mr-1 inline h-3 w-3" aria-hidden /> : <Globe2 className="mr-1 inline h-3 w-3" aria-hidden />}
                    {a.district_id ? (M ? "जिल्हा" : "District") : (M ? "राज्यस्तरीय" : "State-wide")}
                  </Badge>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{a.body}</p>
                <p className="mt-2 text-xs text-muted">{new Date(a.created_at).toLocaleString(M ? "mr-IN" : "en-IN")}</p>
              </div>
              {canPost && (
                <Button variant="ghost" size="icon" disabled={pending} onClick={() => remove(a.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-danger" aria-hidden />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
