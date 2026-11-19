"use server";

/**
 * Public dentist reads (no email or personal phone ever leaves the server) plus the legacy names the
 * current admin components import, now admin-only and delegating to src/lib/actions/admin.ts.
 */
import type { Prisma } from "@prisma/client";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/lib/action-result";
import { summariseSchedule } from "@/lib/availability";
import { NotFoundError, runAction } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation";
import {
  type AdminDoctorDTO,
  adminCreateDoctor,
  adminListDoctors,
  adminUpdateDoctor,
} from "./admin";

export interface PublicDoctorDTO {
  id: string;
  slug: string | null;
  name: string;
  speciality: string;
  bio: string | null;
  imageUrl: string;
  gender: "MALE" | "FEMALE";
  yearsExperience: number | null;
  languages: string[];
  education: string | null;
  services: {
    id: string;
    slug: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  }[];
  /** [{ weekday: 1, ranges: ["09:00-13:00", "14:00-17:00"] }] in clinic-local time */
  schedule: { weekday: number; ranges: string[] }[];
  rating: { average: number | null; count: number };
  /** Legacy fields kept for current components: clinic main line (never the dentist's own), visit count. */
  phone: string;
  appointmentCount: number;
}

const publicDoctorSelect = {
  id: true,
  slug: true,
  name: true,
  speciality: true,
  bio: true,
  imageUrl: true,
  gender: true,
  yearsExperience: true,
  languages: true,
  education: true,
  services: {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      durationMinutes: true,
      priceCents: true,
    },
  },
  schedules: { select: { weekday: true, startTime: true, endTime: true } },
  _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
} satisfies Prisma.DoctorSelect;

async function ratingsFor(doctorIds: string[]) {
  if (doctorIds.length === 0)
    return new Map<string, { average: number | null; count: number }>();
  const rows = await prisma.review.groupBy({
    by: ["doctorId"],
    where: { doctorId: { in: doctorIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((r) => [
      r.doctorId,
      {
        average:
          r._avg.rating === null ? null : Math.round(r._avg.rating * 10) / 10,
        count: r._count._all,
      },
    ]),
  );
}

type PublicDoctorRow = Awaited<ReturnType<typeof findPublicDoctors>>[number];
function findPublicDoctors(where: {
  isActive: true;
  slug?: string;
  services?: { some: { id: string } };
}) {
  return prisma.doctor.findMany({
    where,
    select: publicDoctorSelect,
    orderBy: { name: "asc" },
  });
}

function toPublicDoctor(
  d: PublicDoctorRow,
  rating?: { average: number | null; count: number },
): PublicDoctorDTO {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    speciality: d.speciality,
    bio: d.bio,
    imageUrl: d.imageUrl,
    gender: d.gender,
    yearsExperience: d.yearsExperience,
    languages: d.languages,
    education: d.education,
    services: d.services,
    schedule: summariseSchedule(d.schedules),
    rating: rating ?? { average: null, count: 0 },
    phone: siteConfig.phone,
    appointmentCount: d._count.appointments,
  };
}

/** Active dentists for the marketing site and booking flow. Optional filter by service. */
export async function getActiveDoctors(input?: {
  serviceId?: string;
}): Promise<ActionResult<PublicDoctorDTO[]>> {
  return runAction(async () => {
    const serviceId = input?.serviceId
      ? idSchema.parse(input.serviceId)
      : undefined;
    const doctors = await findPublicDoctors({
      isActive: true,
      ...(serviceId ? { services: { some: { id: serviceId } } } : {}),
    });
    const ratings = await ratingsFor(doctors.map((d) => d.id));
    return doctors.map((d) => toPublicDoctor(d, ratings.get(d.id)));
  });
}

export async function getDoctorBySlug(
  slug: string,
): Promise<ActionResult<PublicDoctorDTO>> {
  return runAction(async () => {
    const parsed = idSchema.parse(slug);
    const [doctor] = await findPublicDoctors({ isActive: true, slug: parsed });
    if (!doctor) throw new NotFoundError("Dentist not found.");
    const ratings = await ratingsFor([doctor.id]);
    return toPublicDoctor(doctor, ratings.get(doctor.id));
  });
}

/** Recent public reviews of a dentist (first name + last initial only). */
export async function getDoctorReviews(doctorId: string): Promise<
  ActionResult<
    {
      id: string;
      rating: number;
      comment: string | null;
      author: string;
      createdAt: string;
    }[]
  >
> {
  return runAction(async () => {
    const id = idSchema.parse(doctorId);
    const reviews = await prisma.review.findMany({
      where: { doctorId: id, user: { deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      author:
        [r.user.firstName, r.user.lastName ? `${r.user.lastName[0]}.` : null]
          .filter(Boolean)
          .join(" ") || "Patient",
      createdAt: r.createdAt.toISOString(),
    }));
  });
}

// ---------------- legacy names (kept so current pages compile; will be removed with the page rewrite) ----------------

/** @deprecated use getActiveDoctors */
export async function getAvailableDoctors(): Promise<
  ActionResult<PublicDoctorDTO[]>
> {
  return getActiveDoctors();
}

/** @deprecated admin-only; use adminListDoctors */
export async function getDoctors(): Promise<ActionResult<AdminDoctorDTO[]>> {
  return adminListDoctors();
}

/** @deprecated admin-only; use adminCreateDoctor */
export async function createDoctor(input: {
  name: string;
  email: string;
  phone: string;
  speciality: string;
  gender: "MALE" | "FEMALE";
  isActive: boolean;
}): Promise<ActionResult<AdminDoctorDTO>> {
  return adminCreateDoctor(input);
}

/** @deprecated admin-only; use adminUpdateDoctor */
export async function updateDoctor(input: {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  speciality?: string;
  gender?: "MALE" | "FEMALE";
  isActive?: boolean;
}): Promise<ActionResult<AdminDoctorDTO>> {
  return adminUpdateDoctor(input);
}
