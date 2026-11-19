/**
 * Authorization guards on the server actions: patients never reach admin data, and patient actions are
 * always scoped to the caller's own rows.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthenticatedError } from "../errors";

const authMock = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));
const db = vi.hoisted(() => {
  const model = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  });
  return {
    appointment: model(),
    doctor: model(),
    service: model(),
    user: model(),
    review: model(),
    visitNote: model(),
  };
});

vi.mock("@/lib/auth", () => authMock);
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/defer", () => ({ defer: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendBookingEmails: vi.fn(),
  sendCancellationEmail: vi.fn(),
  sendRescheduleEmails: vi.fn(),
}));

import {
  adminCreateDoctor,
  adminGetAppointments,
  adminGetDashboardStats,
  adminGetPatient,
  adminUpdateAppointmentStatus,
} from "../actions/admin";
import {
  cancelMyAppointment,
  getMyAppointments,
  submitReview,
} from "../actions/appointments";
import { getDoctors, updateDoctor } from "../actions/doctors";
import { updateMyProfile } from "../actions/profile";

const patient = { id: "patient-1", email: "p@example.com", role: "PATIENT" };

beforeEach(() => {
  vi.clearAllMocks();
  authMock.requireUser.mockResolvedValue(patient);
  authMock.requireAdmin.mockRejectedValue(new ForbiddenError());
});

describe("admin actions reject non-admins before any query", () => {
  const calls = {
    adminGetAppointments: () => adminGetAppointments({}),
    adminGetDashboardStats: () => adminGetDashboardStats(),
    adminGetPatient: () => adminGetPatient("someone"),
    adminCreateDoctor: () =>
      adminCreateDoctor({
        name: "Dr X",
        email: "x@example.com",
        phone: "5550100",
        speciality: "General",
        gender: "MALE",
      }),
    adminUpdateAppointmentStatus: () =>
      adminUpdateAppointmentStatus({
        appointmentId: "a1",
        status: "CANCELLED",
      }),
    "legacy getDoctors": () => getDoctors(),
    "legacy updateDoctor": () => updateDoctor({ id: "d1", name: "Hacked" }),
  };
  for (const [name, call] of Object.entries(calls)) {
    it(name, async () => {
      const result = await call();
      expect(result).toMatchObject({ ok: false, code: "FORBIDDEN" });
      for (const model of Object.values(db))
        for (const fn of Object.values(model))
          expect(fn).not.toHaveBeenCalled();
    });
  }

  it("signed-out callers get UNAUTHENTICATED", async () => {
    authMock.requireAdmin.mockRejectedValue(new UnauthenticatedError());
    await expect(adminGetAppointments()).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHENTICATED",
    });
  });
});

describe("patient actions are scoped to the caller", () => {
  it("lists only the caller's appointments", async () => {
    await getMyAppointments();
    expect(db.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "patient-1" } }),
    );
  });

  it("cannot cancel someone else's appointment (looked up with the caller's id; NOT_FOUND, no update)", async () => {
    const result = await cancelMyAppointment({
      appointmentId: "someone-elses",
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(db.appointment.findFirst).toHaveBeenCalledWith({
      where: { id: "someone-elses", userId: "patient-1" },
    });
    expect(db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("cannot review someone else's visit", async () => {
    const result = await submitReview({
      appointmentId: "someone-elses",
      rating: 5,
    });
    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(db.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "someone-elses", userId: "patient-1" },
      }),
    );
    expect(db.review.create).not.toHaveBeenCalled();
  });

  it("cannot review a visit that is not completed", async () => {
    db.appointment.findFirst.mockResolvedValueOnce({
      id: "a1",
      status: "CONFIRMED",
      doctorId: "d1",
      review: null,
    });
    await expect(
      submitReview({ appointmentId: "a1", rating: 4 }),
    ).resolves.toMatchObject({ ok: false, code: "CONFLICT" });
  });

  it("rejects an out-of-range rating before touching the database", async () => {
    await expect(
      submitReview({ appointmentId: "a1", rating: 6 }),
    ).resolves.toMatchObject({ ok: false, code: "VALIDATION" });
    expect(db.appointment.findFirst).not.toHaveBeenCalled();
  });

  it("updates only the caller's profile and ignores fields it does not allow (role, email)", async () => {
    db.user.update.mockResolvedValue({
      ...patient,
      createdAt: new Date(),
      dateOfBirth: null,
      marketingOptIn: false,
    });
    await updateMyProfile({
      firstName: "Pat",
      role: "ADMIN",
      email: "evil@example.com",
    } as never);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "patient-1" },
      data: { firstName: "Pat" },
    });
  });

  it("signed-out patients get UNAUTHENTICATED", async () => {
    authMock.requireUser.mockRejectedValue(new UnauthenticatedError());
    await expect(getMyAppointments()).resolves.toMatchObject({
      ok: false,
      code: "UNAUTHENTICATED",
    });
  });
});
