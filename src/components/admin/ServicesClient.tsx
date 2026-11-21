"use client";

import { Loader2, Pencil, Plus, Tags } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import {
  useAdminCreateService,
  useAdminServices,
  useAdminUpdateService,
} from "@/hooks/use-admin";
import type { AdminServiceDTO } from "@/lib/actions/admin";
import { formatMoney } from "@/lib/time";
import { cn } from "@/lib/utils";
import { errorMessage, fieldError, ListSkeleton, QueryError } from "./shared";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export function ServicesClient() {
  const q = useAdminServices();
  const update = useAdminUpdateService();
  const [editing, setEditing] = useState<AdminServiceDTO | "new" | null>(null);

  async function toggle(s: AdminServiceDTO, isActive: boolean) {
    try {
      await update.mutateAsync({ id: s.id, isActive });
      toast.success(
        isActive
          ? `${s.name} is bookable again`
          : `${s.name} hidden from booking`,
      );
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="What patients can book"
        description="Duration and price are copied onto each booking, so edits only affect new appointments."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            Add service
          </Button>
        }
      />

      {q.error && !q.data ? (
        <QueryError error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data ? (
        <ListSkeleton />
      ) : q.data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No services yet"
          body="Add the treatments you offer, with a duration and a price."
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus aria-hidden />
              Add service
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-xs md:block">
            <Table className="table-fixed">
              <caption className="sr-only">Services</caption>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Service</TableHead>
                  <TableHead className="w-36">Category</TableHead>
                  <TableHead className="w-24 text-right">Duration</TableHead>
                  <TableHead className="w-28 text-right">Price</TableHead>
                  <TableHead className="w-24 text-right">Bookings</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-14">
                    <span className="sr-only">Edit</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.map((s) => (
                  <TableRow
                    key={s.id}
                    className={cn(
                      "h-16",
                      !s.isActive && "text-muted-foreground",
                    )}
                  >
                    <TableCell>
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        /{s.slug}
                      </p>
                    </TableCell>
                    <TableCell className="truncate">{s.category}</TableCell>
                    <TableCell className="text-right">
                      {s.durationMinutes} min
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(s.priceCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.appointmentCount}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.isActive}
                        disabled={update.isPending}
                        onCheckedChange={(v) => toggle(s, v)}
                        aria-label={`${s.name} is ${s.isActive ? "active" : "inactive"}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(s)}
                        aria-label={`Edit ${s.name}`}
                      >
                        <Pencil aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-3 md:hidden">
            {q.data.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border bg-card p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-tight">
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.category}
                    </p>
                  </div>
                  <Switch
                    checked={s.isActive}
                    disabled={update.isPending}
                    onCheckedChange={(v) => toggle(s, v)}
                    aria-label={`${s.name} is ${s.isActive ? "active" : "inactive"}`}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-muted-foreground" data-numeric>
                    {s.durationMinutes} min · {formatMoney(s.priceCents)} ·{" "}
                    {s.appointmentCount} booked
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(s)}
                  >
                    <Pencil aria-hidden />
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ServiceSheet
        service={editing === "new" ? null : editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        categories={[...new Set(q.data?.map((s) => s.category) ?? [])]}
      />
    </>
  );
}

type Draft = {
  name: string;
  slug: string;
  category: string;
  duration: string;
  price: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY: Draft = {
  name: "",
  slug: "",
  category: "",
  duration: "30",
  price: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

function ServiceSheet({
  service,
  open,
  onOpenChange,
  categories,
}: {
  service: AdminServiceDTO | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: string[];
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const create = useAdminCreateService();
  const update = useAdminUpdateService();
  const mutation = service ? update : create;
  const pending = mutation.isPending;
  const id = service?.id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the draft each time the sheet opens
  useEffect(() => {
    if (!open) return;
    create.reset();
    update.reset();
    setSlugTouched(!!service);
    setDraft(
      service
        ? {
            name: service.name,
            slug: service.slug,
            category: service.category,
            duration: String(service.durationMinutes),
            price: (service.priceCents / 100).toFixed(2),
            description: service.description,
            sortOrder: String(service.sortOrder),
            isActive: service.isActive,
          }
        : EMPTY,
    );
  }, [open, id]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const err = (f: string) => fieldError(mutation.error, f);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: draft.name,
      slug: draft.slug,
      category: draft.category,
      durationMinutes: Number(draft.duration),
      priceCents: Math.round(Number(draft.price || 0) * 100),
      description: draft.description,
      sortOrder: Number(draft.sortOrder || 0),
      isActive: draft.isActive,
    };
    try {
      if (service) await update.mutateAsync({ id: service.id, ...payload });
      else await create.mutateAsync(payload);
      toast.success(service ? "Service updated" : "Service added");
      onOpenChange(false);
    } catch (e2) {
      toast.error(errorMessage(e2));
    }
  }

  const fieldErr = (f: string) =>
    err(f) ? (
      <p className="text-xs text-destructive" role="alert">
        {err(f)}
      </p>
    ) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <form onSubmit={onSubmit} className="flex min-h-full flex-col">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="font-display text-2xl font-normal">
              {service ? "Edit service" : "Add a service"}
            </SheetTitle>
            <SheetDescription>
              {service
                ? "A new price applies to future bookings only."
                : "It appears in booking once a dentist offers it."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Name</Label>
              <Input
                id="svc-name"
                value={draft.name}
                required
                minLength={2}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!slugTouched) set("slug", slugify(e.target.value));
                }}
              />
              {fieldErr("name")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-slug">Web address</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  /services/
                </span>
                <Input
                  id="svc-slug"
                  value={draft.slug}
                  required
                  className="font-mono text-sm"
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </div>
              {fieldErr("slug")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-category">Category</Label>
              <Input
                id="svc-category"
                list="svc-categories"
                value={draft.category}
                required
                minLength={2}
                onChange={(e) => set("category", e.target.value)}
              />
              <datalist id="svc-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {fieldErr("category")}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="svc-duration">Duration (minutes)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={480}
                  step={5}
                  required
                  value={draft.duration}
                  onChange={(e) => set("duration", e.target.value)}
                />
                {fieldErr("durationMinutes")}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-price">Price</Label>
                <Input
                  id="svc-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  required
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  In {siteConfig.clinic.currency}
                </p>
                {fieldErr("priceCents")}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-description">Description</Label>
              <Textarea
                id="svc-description"
                rows={4}
                required
                maxLength={2000}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
              {fieldErr("description")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-sort">Sort order</Label>
              <Input
                id="svc-sort"
                type="number"
                inputMode="numeric"
                min={0}
                value={draft.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                className="w-28"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers are listed first.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <Label htmlFor="svc-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive services cannot be booked.
                </p>
              </div>
              <Switch
                id="svc-active"
                checked={draft.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
            </div>
          </div>
          <SheetFooter className="sticky bottom-0 flex-row justify-end gap-2 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              {service ? "Save changes" : "Add service"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
