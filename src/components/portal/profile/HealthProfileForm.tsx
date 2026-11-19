"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { useUpdateMyProfile } from "@/hooks/use-profile";
import { ActionFailedError } from "@/lib/action-result";
import type { ProfileDTO } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";
import type { ProfileInput } from "@/lib/validation";
import { useUnsavedChangesGuard } from "./use-unsaved-guard";

const PHONE_RE = /^[+()\d\s.-]*$/;
const phone = z
  .string()
  .trim()
  .max(32, "Keep it under 32 characters")
  .regex(PHONE_RE, "Use digits, spaces and + ( ) - . only");

const schema = z
  .object({
    phone,
    dateOfBirth: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            v >= "1900-01-01" &&
            v <= new Date().toISOString().slice(0, 10)),
        "Enter a real date of birth",
      ),
    allergies: z.string().trim().max(2000, "Keep it under 2,000 characters"),
    medications: z.string().trim().max(2000, "Keep it under 2,000 characters"),
    medicalNotes: z.string().trim().max(4000, "Keep it under 4,000 characters"),
    emergencyContactName: z
      .string()
      .trim()
      .max(120, "Keep it under 120 characters"),
    emergencyContactPhone: phone,
    marketingOptIn: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.emergencyContactName && !v.emergencyContactPhone)
      ctx.addIssue({
        code: "custom",
        path: ["emergencyContactPhone"],
        message: "Add a phone number for your emergency contact",
      });
    if (v.emergencyContactPhone && !v.emergencyContactName)
      ctx.addIssue({
        code: "custom",
        path: ["emergencyContactName"],
        message: "Add your emergency contact's name",
      });
  });

type Values = z.infer<typeof schema>;
const FIELDS = [
  "phone",
  "dateOfBirth",
  "allergies",
  "medications",
  "medicalNotes",
  "emergencyContactName",
  "emergencyContactPhone",
  "marketingOptIn",
] as const satisfies readonly FieldPath<Values>[];

function toValues(p: ProfileDTO): Values {
  return {
    phone: p.phone ?? "",
    dateOfBirth: p.dateOfBirth ?? "",
    allergies: p.allergies ?? "",
    medications: p.medications ?? "",
    medicalNotes: p.medicalNotes ?? "",
    emergencyContactName: p.emergencyContactName ?? "",
    emergencyContactPhone: p.emergencyContactPhone ?? "",
    marketingOptIn: p.marketingOptIn,
  };
}

function toInput(v: Values): ProfileInput {
  const orNull = (s: string) => (s.trim() ? s.trim() : null);
  return {
    phone: orNull(v.phone),
    dateOfBirth: v.dateOfBirth || null,
    allergies: orNull(v.allergies),
    medications: orNull(v.medications),
    medicalNotes: orNull(v.medicalNotes),
    emergencyContactName: orNull(v.emergencyContactName),
    emergencyContactPhone: orNull(v.emergencyContactPhone),
    marketingOptIn: v.marketingOptIn,
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid min-w-0 gap-6 border-t py-8 first:border-t-0 first:pt-0 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <legend className="font-display text-lg text-foreground">
          {title}
        </legend>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function HealthProfileForm({ profile }: { profile: ProfileDTO }) {
  const update = useUpdateMyProfile();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(profile),
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = form;

  useUnsavedChangesGuard(isDirty);

  const onSubmit = handleSubmit((values) =>
    update.mutate(toInput(values), {
      onSuccess: (saved) => {
        reset(toValues(saved));
        toast.success("Health profile saved");
      },
      onError: (error) => {
        if (error instanceof ActionFailedError && error.fieldErrors) {
          let first = true;
          for (const [key, messages] of Object.entries(error.fieldErrors)) {
            if ((FIELDS as readonly string[]).includes(key) && messages[0]) {
              setError(
                key as (typeof FIELDS)[number],
                { message: messages[0] },
                { shouldFocus: first },
              );
              first = false;
            }
          }
          if (!first) return;
        }
        setError("root", {
          message: error.message || "We couldn't save your changes. Try again.",
        });
      },
    }),
  );

  const describe = (id: keyof Values, hint?: boolean) =>
    errors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const invalid = (id: keyof Values) => (errors[id] ? true : undefined);
  const optIn = watch("marketingOptIn");

  return (
    <form onSubmit={onSubmit} noValidate className="relative">
      <div className="rounded-2xl border bg-card p-5 shadow-xs sm:p-8">
        <Section
          title="Contact"
          description="So the front desk can reach you about your visits."
        >
          <Field id="phone" label="Mobile phone" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={invalid("phone")}
              aria-describedby={describe("phone")}
              {...register("phone")}
            />
          </Field>
          <Field
            id="dateOfBirth"
            label="Date of birth"
            error={errors.dateOfBirth?.message}
          >
            <Input
              id="dateOfBirth"
              type="date"
              autoComplete="bday"
              max={new Date().toISOString().slice(0, 10)}
              aria-invalid={invalid("dateOfBirth")}
              aria-describedby={describe("dateOfBirth")}
              {...register("dateOfBirth")}
            />
          </Field>
        </Section>

        <Section
          title="Medical"
          description="Your dentist reads this before every visit. Only clinic staff can see it."
        >
          <Field
            id="allergies"
            label="Allergies"
            hint="Include reactions to medicines, latex or anaesthetics. Write “None” if you have none."
            error={errors.allergies?.message}
            wide
          >
            <Textarea
              id="allergies"
              rows={2}
              aria-invalid={invalid("allergies")}
              aria-describedby={describe("allergies", true)}
              {...register("allergies")}
            />
          </Field>
          <Field
            id="medications"
            label="Current medications"
            hint="Especially blood thinners, bisphosphonates and anything taken daily. Write “None” if you take none."
            error={errors.medications?.message}
            wide
          >
            <Textarea
              id="medications"
              rows={2}
              aria-invalid={invalid("medications")}
              aria-describedby={describe("medications", true)}
              {...register("medications")}
            />
          </Field>
          <Field
            id="medicalNotes"
            label="Anything else we should know"
            hint="Conditions, pregnancy, dental anxiety, past treatment."
            error={errors.medicalNotes?.message}
            wide
          >
            <Textarea
              id="medicalNotes"
              rows={3}
              aria-invalid={invalid("medicalNotes")}
              aria-describedby={describe("medicalNotes", true)}
              {...register("medicalNotes")}
            />
          </Field>
        </Section>

        <Section
          title="Emergency contact"
          description="Who we call if something happens during a visit."
        >
          <Field
            id="emergencyContactName"
            label="Name"
            error={errors.emergencyContactName?.message}
          >
            <Input
              id="emergencyContactName"
              autoComplete="off"
              aria-invalid={invalid("emergencyContactName")}
              aria-describedby={describe("emergencyContactName")}
              {...register("emergencyContactName")}
            />
          </Field>
          <Field
            id="emergencyContactPhone"
            label="Phone"
            error={errors.emergencyContactPhone?.message}
          >
            <Input
              id="emergencyContactPhone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              aria-invalid={invalid("emergencyContactPhone")}
              aria-describedby={describe("emergencyContactPhone")}
              {...register("emergencyContactPhone")}
            />
          </Field>
        </Section>

        <Section
          title="Email"
          description="Visit confirmations and reminders are always sent."
        >
          <div className="flex items-start justify-between gap-4 sm:col-span-2">
            <div>
              <Label htmlFor="marketingOptIn">Clinic news and offers</Label>
              <p
                id="marketingOptIn-hint"
                className="mt-1 text-sm text-muted-foreground"
              >
                An occasional email from {siteConfig.name}. Unsubscribe any
                time.
              </p>
            </div>
            <Switch
              id="marketingOptIn"
              checked={optIn}
              onCheckedChange={(v) =>
                setValue("marketingOptIn", v, { shouldDirty: true })
              }
              aria-describedby="marketingOptIn-hint"
            />
          </div>
        </Section>
      </div>

      <div aria-live="assertive">
        {errors.root?.message ? (
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 text-sm text-destructive"
          >
            <TriangleAlert className="size-4" aria-hidden />
            {errors.root.message}
          </p>
        ) : null}
      </div>

      {/* Save bar: sticks to the bottom of the viewport while there are edits. */}
      <div
        className={cn(
          "sticky z-20 mt-6 flex items-center justify-between gap-3 rounded-xl border bg-popover/95 px-4 py-3 shadow-lg backdrop-blur-lg transition-[opacity,transform] duration-200 ease-out",
          "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6",
          isDirty || update.isPending
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
        aria-hidden={!isDirty && !update.isPending}
      >
        <p className="whitespace-nowrap text-sm font-medium text-foreground">
          Unsaved<span className="hidden sm:inline"> changes</span>
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => reset(toValues(profile))}
            disabled={update.isPending}
            tabIndex={isDirty ? undefined : -1}
          >
            Discard
          </Button>
          <Button
            type="submit"
            disabled={update.isPending || !isDirty}
            tabIndex={isDirty ? undefined : -1}
          >
            {update.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
