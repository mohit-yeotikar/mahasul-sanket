"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Card, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { CATEGORY_LABELS } from "@/lib/i18n/dictionaries";
import { createTicketAction } from "./actions";

const schema = z.object({
  subject: z.string().min(5, "Min 5 characters").max(200),
  description: z.string().min(10, "Min 10 characters").max(5000),
  category: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]),
});
type FormData = z.infer<typeof schema>;

export function NewTicketForm() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string>();

  // Pre-filled when arriving from a low-confidence AI answer
  const sourceQuestion = params.get("question") ?? "";
  const aiDraft = params.get("draft") ?? "";
  const aiConfidence = params.get("confidence") ?? "";

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: sourceQuestion.slice(0, 180),
      description: sourceQuestion,
      category: "others",
      priority: "medium",
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(undefined);
    const res = await createTicketAction({
      ...data,
      sourceQuestion: sourceQuestion || undefined,
      aiAnswerDraft: aiDraft || undefined,
      aiConfidence: aiConfidence ? Number(aiConfidence) : undefined,
    });
    if (!res.ok) return setServerError(res.error);
    router.push(`/tickets/${res.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">{t("createTicket")}</h1>
      <Card className="p-6">
        {sourceQuestion && (
          <p className="mb-4 rounded-lg bg-accent-soft p-3 text-sm">
            {lang === "mr"
              ? "AI ला या प्रश्नाचे खात्रीशीर उत्तर सापडले नाही — हे तिकीट नायब तहसीलदारांकडे (L2) जाईल."
              : "The AI was not confident about this question — this ticket goes to the Nayab Tahsildar (L2)."}
          </p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label={t("subject")} error={errors.subject?.message} required>
            <Input {...register("subject")} />
          </Field>
          <Field label={t("description")} error={errors.description?.message} required>
            <Textarea rows={5} {...register("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("category")} required>
              <Select {...register("category")}>
                {Object.entries(CATEGORY_LABELS).map(([value, labels]) => (
                  <option key={value} value={value}>{labels[lang]}</option>
                ))}
              </Select>
            </Field>
            <Field label={t("priority")} required>
              <Select {...register("priority")}>
                <option value="low">{lang === "mr" ? "कमी" : "Low"}</option>
                <option value="medium">{lang === "mr" ? "मध्यम" : "Medium"}</option>
                <option value="high">{lang === "mr" ? "उच्च" : "High"}</option>
                <option value="critical">{lang === "mr" ? "अत्यावश्यक" : "Critical"}</option>
              </Select>
            </Field>
          </div>

          {serverError && (
            <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{serverError}</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : t("createTicket")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
