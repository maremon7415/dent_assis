import { cache } from "react";
import {
  getAvailableDays,
  getAvailableSlots,
} from "@/lib/actions/appointments";
import {
  getActiveDoctors,
  getDoctorBySlug,
  getDoctorReviews,
  type PublicDoctorDTO,
} from "@/lib/actions/doctors";
import { getServices, type ServiceDTO } from "@/lib/actions/services";

/**
 * Server-side reads for the marketing pages. Each returns `null` when the database could not be
 * reached (so a page can say so) and an empty array when there is simply nothing to show.
 */
export const loadServices = cache(async (): Promise<ServiceDTO[] | null> => {
  const res = await getServices();
  return res.ok ? res.data : null;
});

export const loadDoctors = cache(
  async (): Promise<PublicDoctorDTO[] | null> => {
    const res = await getActiveDoctors();
    return res.ok ? res.data : null;
  },
);

export const loadDoctor = cache(
  async (
    slug: string,
  ): Promise<
    { ok: true; doctor: PublicDoctorDTO } | { ok: false; notFound: boolean }
  > => {
    const res = await getDoctorBySlug(slug);
    if (res.ok) return { ok: true, doctor: res.data };
    return { ok: false, notFound: res.code === "NOT_FOUND" };
  },
);

export async function loadReviews(doctorId: string) {
  const res = await getDoctorReviews(doctorId);
  return res.ok ? res.data : null;
}

export type NextOpening = {
  doctor: Pick<
    PublicDoctorDTO,
    "id" | "slug" | "name" | "speciality" | "imageUrl"
  >;
  service: Pick<
    ServiceDTO,
    "id" | "slug" | "name" | "durationMinutes" | "priceCents"
  >;
  date: string;
  slots: { time: string; label: string }[];
};

/**
 * The hero's live moment: the first free day for a routine visit with a real dentist and its real
 * start times. Prefers the clinic's first service (in display order) and the dentist offering it
 * with the soonest opening. Returns null when nothing is bookable or the database is unavailable.
 */
export const loadNextOpening = cache(async (): Promise<NextOpening | null> => {
  const [services, doctors] = await Promise.all([
    loadServices(),
    loadDoctors(),
  ]);
  if (!services?.length || !doctors?.length) return null;

  for (const service of services.slice(0, 3)) {
    const offering = doctors.filter((d) =>
      d.services.some((s) => s.id === service.id),
    );
    const candidates = await Promise.all(
      offering.slice(0, 4).map(async (doctor) => {
        const days = await getAvailableDays({
          doctorId: doctor.id,
          serviceId: service.id,
          days: 14,
        });
        const first = days.ok ? days.data.find((d) => d.slots > 0) : undefined;
        return first ? { doctor, date: first.date } : null;
      }),
    );
    const best = candidates
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!best) continue;
    const slots = await getAvailableSlots(
      best.doctor.id,
      best.date,
      service.id,
    );
    if (!slots.ok || slots.data.length === 0) continue;
    return {
      doctor: best.doctor,
      service,
      date: best.date,
      slots: slots.data.map((s) => ({ time: s.time, label: s.label })),
    };
  }
  return null;
});
