/**
 * Plain, serialisable shapes returned to the client. Mapping happens here so no action leaks a
 * column by accident (e.g. doctor email/phone on public reads, other patients' data).
 */
import type {
  Appointment,
  Doctor,
  Review,
  Service,
  User,
  VisitNote,
} from "@prisma/client";
import { siteConfig } from "@/config/site";
import { hasMinNotice } from "./availability";
import { ACTIVE_STATUSES, appointmentInterval } from "./booking";
import {
  formatClinicDate,
  formatClinicTime,
  toLocalDate,
  toLocalTime,
} from "./time";

export type PublicDoctorRef = Pick<
  Doctor,
  "id" | "name" | "speciality" | "imageUrl"
> & { slug: string | null };
export type ServiceRef = Pick<Service, "id" | "name" | "slug">;

export interface VisitNoteDTO {
  summary: string;
  treatment: string | null;
  followUpInDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface AppointmentDTO {
  id: string;
  status: Appointment["status"];
  /** UTC ISO instants */
  startsAt: string;
  endsAt: string;
  /** clinic-local "YYYY-MM-DD" (kept under the legacy name `date`) */
  date: string;
  /** clinic-local "HH:mm" */
  time: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  priceCents: number | null;
  reason: string | null;
  notes: string | null;
  doctor: PublicDoctorRef;
  service: ServiceRef | null;
  visitNote: VisitNoteDTO | null;
  review: ReviewDTO | null;
  cancelledAt: string | null;
  cancelledBy: Appointment["cancelledBy"];
  cancelReason: string | null;
  rescheduledFromId: string | null;
  canCancel: boolean;
  canReschedule: boolean;
  canReview: boolean;
  /** Legacy flat fields still read by current pages. */
  doctorName: string;
  doctorImageUrl: string;
  doctorId: string;
}

export interface AdminAppointmentDTO extends AppointmentDTO {
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    deleted: boolean;
  };
  /** CONFIRMED but already over: admin should record COMPLETED or NO_SHOW. */
  needsOutcome: boolean;
  /** Legacy flat fields read by the current admin table. */
  patientName: string;
  patientEmail: string;
}

type AppointmentRow = Appointment & {
  doctor: Pick<Doctor, "id" | "name" | "speciality" | "imageUrl" | "slug">;
  service?:
    | (Pick<Service, "id" | "name" | "slug"> &
        Partial<Pick<Service, "durationMinutes">>)
    | null;
  visitNote?: VisitNote | null;
  review?: Review | null;
};

export const appointmentInclude = {
  doctor: {
    select: {
      id: true,
      name: true,
      speciality: true,
      imageUrl: true,
      slug: true,
    },
  },
  service: {
    select: { id: true, name: true, slug: true, durationMinutes: true },
  },
  visitNote: true,
  review: true,
} as const;

export const adminAppointmentInclude = {
  ...appointmentInclude,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      deletedAt: true,
    },
  },
} as const;

export function fullName(u: Pick<User, "firstName" | "lastName">): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
}

function visitNoteDTO(n: VisitNote | null | undefined): VisitNoteDTO | null {
  if (!n) return null;
  return {
    summary: n.summary,
    treatment: n.treatment,
    followUpInDays: n.followUpInDays,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export function toAppointmentDTO(
  a: AppointmentRow,
  now: Date = new Date(),
): AppointmentDTO {
  const interval = appointmentInterval(a) ?? {
    startsAt: a.date,
    endsAt: a.date,
  };
  const active = ACTIVE_STATUSES.includes(a.status);
  const changeable =
    active &&
    hasMinNotice(interval.startsAt, now, siteConfig.clinic.minNoticeHours);
  return {
    id: a.id,
    status: a.status,
    startsAt: interval.startsAt.toISOString(),
    endsAt: interval.endsAt.toISOString(),
    date: toLocalDate(interval.startsAt),
    time: toLocalTime(interval.startsAt),
    dateLabel: formatClinicDate(interval.startsAt),
    timeLabel: formatClinicTime(interval.startsAt),
    // The treatment's own length (a 45-minute check-up says 45 min). The stored interval is rounded
    // up to the slot grid so the diary has no gaps; that rounding stays server-side.
    durationMinutes:
      a.service?.durationMinutes ??
      Math.round(
        (interval.endsAt.getTime() - interval.startsAt.getTime()) / 60_000,
      ),
    priceCents: a.priceCents,
    reason: a.reason,
    notes: a.notes,
    doctor: {
      id: a.doctor.id,
      name: a.doctor.name,
      speciality: a.doctor.speciality,
      imageUrl: a.doctor.imageUrl,
      slug: a.doctor.slug,
    },
    service: a.service
      ? { id: a.service.id, name: a.service.name, slug: a.service.slug }
      : null,
    visitNote: visitNoteDTO(a.visitNote),
    review: a.review
      ? {
          id: a.review.id,
          rating: a.review.rating,
          comment: a.review.comment,
          createdAt: a.review.createdAt.toISOString(),
        }
      : null,
    cancelledAt: a.cancelledAt?.toISOString() ?? null,
    cancelledBy: a.cancelledBy,
    cancelReason: a.cancelReason,
    rescheduledFromId: a.rescheduledFromId,
    canCancel: changeable,
    canReschedule: changeable,
    canReview: a.status === "COMPLETED" && !a.review,
    doctorName: a.doctor.name,
    doctorImageUrl: a.doctor.imageUrl,
    doctorId: a.doctor.id,
  };
}

export function toAdminAppointmentDTO(
  a: AppointmentRow & {
    user: Pick<
      User,
      "id" | "firstName" | "lastName" | "email" | "phone" | "deletedAt"
    >;
  },
  now: Date = new Date(),
): AdminAppointmentDTO {
  const base = toAppointmentDTO(a, now);
  const name = fullName(a.user) || a.user.email;
  return {
    ...base,
    patient: {
      id: a.user.id,
      name,
      email: a.user.email,
      phone: a.user.phone,
      deleted: !!a.user.deletedAt,
    },
    needsOutcome:
      a.status === "CONFIRMED" &&
      new Date(base.endsAt).getTime() < now.getTime(),
    patientName: name,
    patientEmail: a.user.email,
  };
}
