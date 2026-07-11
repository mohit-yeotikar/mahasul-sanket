"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Landmark } from "lucide-react";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { loginAction } from "../actions";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, "10-digit mobile number"),
  password: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { t } = useLang();
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(undefined);
    const res = await loginAction(data);
    if (!res.ok) return setServerError(res.error);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card className="p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg">
          <Landmark className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold">{t("appName")}</h1>
        <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label={t("mobile")} error={errors.mobile?.message} required>
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            placeholder="9XXXXXXXXX"
            {...register("mobile")}
          />
        </Field>
        <Field label={t("password")} error={errors.password?.message} required>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>

        {serverError && (
          <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : t("login")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("noAccount")}
        </Link>
      </p>
    </Card>
  );
}
