"use server";

import type { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export interface ServiceDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
  /** Number of active dentists offering it. */
  doctorCount: number;
}

/** Active services in display order (public). */
export async function getServices(): Promise<ActionResult<ServiceDTO[]>> {
  return runAction(async () => {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { doctors: { where: { isActive: true } } } },
      },
    });
    return services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      priceCents: s.priceCents,
      category: s.category,
      doctorCount: s._count.doctors,
    }));
  });
}
