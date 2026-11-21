"use client";

import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminCreateDoctor,
  useAdminServices,
  useAdminUpdateDoctor,
} from "@/hooks/use-admin";
import type { AdminDoctorDTO } from "@/lib/actions/admin";
import { errorMessage, fieldError } from "./shared";

type Draft = {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  gender: "MALE" | "FEMALE";
  bio: string;
  yearsExperience: string;
  languages: string;
  education: string;
  serviceIds: string[];
  isActive: boolean;
};

const EMPTY: Draft = {
  name: "",
  email: "",
  phone: "",
  speciality: "",
  gender: "FEMALE",
  bio: "",
  yearsExperience: "",
  languages: "",
  education: "",
  serviceIds: [],
  isActive: true,
};

function toDraft(d: AdminDoctorDTO | null): Draft {
  if (!d) return EMPTY;
  return {
    name: d.name,
    email: d.email,
    phone: d.phone,
    speciality: d.speciality,
    gender: d.gender,
    bio: d.bio ?? "",
    yearsExperience:
      d.yearsExperience === null ? "" : String(d.yearsExperience),
    languages: d.languages.join(", "),
    education: d.education ?? "",
    serviceIds: d.services.map((s) => s.id),
    isActive: d.isActive,
  };
}

/** Create or edit a dentist. Edit mode when `doctor` is passed. */
export function DentistFormSheet({
  open,
  onOpenChange,
  doctor,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: AdminDoctorDTO | null;
  onSaved?: (d: AdminDoctorDTO) => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const create = useAdminCreateDoctor();
  const update = useAdminUpdateDoctor();
  const services = useAdminServices();
  const mutation = doctor ? update : create;
  const pending = mutation.isPending;

  const doctorId = doctor?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the draft each time the sheet opens
  useEffect(() => {
    if (open) {
      setDraft(toDraft(doctor));
      create.reset();
      update.reset();
    }
  }, [open, doctorId]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const err = (f: string) => fieldError(mutation.error, f);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: draft.name,
      email: draft.email,
      phone: draft.phone,
      speciality: draft.speciality,
      gender: draft.gender,
      bio: draft.bio || null,
      yearsExperience: draft.yearsExperience
        ? Number(draft.yearsExperience)
        : null,
      languages: draft.languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      education: draft.education || null,
      serviceIds: draft.serviceIds,
      isActive: draft.isActive,
    };
    try {
      const saved = doctor
        ? await update.mutateAsync({ id: doctor.id, ...payload })
        : await create.mutateAsync(payload);
      toast.success(doctor ? "Dentist updated" : `${saved.name} added`);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e2) {
      toast.error(errorMessage(e2));
    }
  }

  const field = (
    id: string,
    label: string,
    node: React.ReactNode,
    key = id,
    hint?: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`dentist-${id}`}>{label}</Label>
      {node}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {err(key) ? (
        <p className="text-xs text-destructive" role="alert">
          {err(key)}
        </p>
      ) : null}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <form onSubmit={onSubmit} className="flex min-h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="font-display text-2xl font-normal">
              {doctor ? "Edit dentist" : "Add a dentist"}
            </SheetTitle>
            <SheetDescription>
              {doctor
                ? "Changes show on the public site and in booking right away."
                : "They appear in booking once they are active and have a weekly schedule."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 px-6 py-5">
            {field(
              "name",
              "Full name",
              <Input
                id="dentist-name"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                required
                minLength={2}
                autoComplete="off"
                placeholder="Dr. Maya Okafor"
              />,
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {field(
                "email",
                "Email",
                <Input
                  id="dentist-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />,
              )}
              {field(
                "phone",
                "Phone",
                <Input
                  id="dentist-phone"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  required
                  minLength={5}
                />,
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field(
                "speciality",
                "Speciality",
                <Input
                  id="dentist-speciality"
                  value={draft.speciality}
                  onChange={(e) => set("speciality", e.target.value)}
                  required
                  placeholder="Orthodontics"
                />,
              )}
              {field(
                "gender",
                "Gender",
                <Select
                  value={draft.gender}
                  onValueChange={(v) => set("gender", v as Draft["gender"])}
                >
                  <SelectTrigger id="dentist-gender" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                  </SelectContent>
                </Select>,
                "gender",
                "Used for the default avatar.",
              )}
            </div>
            {field(
              "bio",
              "Bio",
              <Textarea
                id="dentist-bio"
                value={draft.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={3}
                maxLength={4000}
              />,
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {field(
                "years",
                "Years of experience",
                <Input
                  id="dentist-years"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={80}
                  value={draft.yearsExperience}
                  onChange={(e) => set("yearsExperience", e.target.value)}
                />,
                "yearsExperience",
              )}
              {field(
                "languages",
                "Languages",
                <Input
                  id="dentist-languages"
                  value={draft.languages}
                  onChange={(e) => set("languages", e.target.value)}
                  placeholder="English, Spanish"
                />,
                "languages",
                "Separate with commas.",
              )}
            </div>
            {field(
              "education",
              "Education",
              <Textarea
                id="dentist-education"
                value={draft.education}
                onChange={(e) => set("education", e.target.value)}
                rows={2}
                maxLength={1000}
              />,
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Services offered</legend>
              {services.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading services...
                </p>
              ) : services.data?.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {services.data.map((s) => {
                    const checked = draft.serviceIds.includes(s.id);
                    return (
                      <li key={s.id}>
                        <label
                          htmlFor={`svc-${s.id}`}
                          className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm has-[:checked]:border-primary/40 has-[:checked]:bg-accent/50"
                        >
                          <Checkbox
                            id={`svc-${s.id}`}
                            checked={checked}
                            onCheckedChange={(c) =>
                              set(
                                "serviceIds",
                                c
                                  ? [...draft.serviceIds, s.id]
                                  : draft.serviceIds.filter((x) => x !== s.id),
                              )
                            }
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {s.name}
                            {s.isActive ? "" : " (inactive)"}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No services yet. Add some under Services first.
                </p>
              )}
            </fieldset>

            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <Label htmlFor="dentist-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive dentists cannot be booked. Their history is kept.
                </p>
              </div>
              <Switch
                id="dentist-active"
                checked={draft.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
            </div>
          </div>

          <SheetFooter className="sticky bottom-0 flex-row justify-end gap-2 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              {doctor ? "Save changes" : "Add dentist"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
