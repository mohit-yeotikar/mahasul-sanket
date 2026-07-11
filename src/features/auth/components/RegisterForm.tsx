"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field, Input, Select, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { registerAction } from "../actions";

const schema = z
  .object({
    fullName: z.string().min(3, "Enter full name"),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile number"),
    governmentId: z.string().min(4, "Enter Government / Sevarth ID"),
    districtId: z.string().uuid("Select district"),
    talukaId: z.string().optional(),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const supabase = createClient();

  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("districts")
        .select("id,name_en,name_mr")
        .order("name_en");
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const districtId = watch("districtId");
  const { data: talukas } = useQuery({
    queryKey: ["talukas", districtId],
    enabled: !!districtId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("talukas")
        .select("id,name_en,name_mr")
        .eq("district_id", districtId)
        .order("name_en");
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(undefined);
    const res = await registerAction(data);
    if (!res.ok) return setServerError(res.error);
    router.push("/pending");
  };

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-center text-2xl font-bold">{t("register")}</h1>
      <p className="mb-6 text-center text-sm text-muted">{t("appName")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label={t("fullName")} error={errors.fullName?.message} required>
          <Input autoComplete="name" {...register("fullName")} />
        </Field>
        <Field label={t("mobile")} error={errors.mobile?.message} required>
          <Input type="tel" inputMode="numeric" maxLength={10} placeholder="9XXXXXXXXX" {...register("mobile")} />
        </Field>
        <Field label={t("governmentId")} error={errors.governmentId?.message} required>
          <Input {...register("governmentId")} />
        </Field>
        <Field label={t("district")} error={errors.districtId?.message} required>
          <Select {...register("districtId")} defaultValue="">
            <option value="" disabled>—</option>
            {districts?.map((d) => (
              <option key={d.id} value={d.id}>
                {lang === "mr" ? d.name_mr : d.name_en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("taluka")}>
          <Select {...register("talukaId")} defaultValue="" disabled={!talukas?.length}>
            <option value="">—</option>
            {talukas?.map((tk) => (
              <option key={tk.id} value={tk.id}>
                {lang === "mr" ? tk.name_mr : tk.name_en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("password")} error={errors.password?.message} required>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        <Field label={t("confirmPassword")} error={errors.confirmPassword?.message} required>
          <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
        </Field>

        {serverError && (
          <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : t("register")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("haveAccount")}
        </Link>
      </p>
    </Card>
  );
}
