/**
 * Email privacy: a patient's free-text reason (which can hold health details) never reaches an email
 * subject or the "appointment type" line, and send logs never carry the subject or the recipient.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
const db = vi.hoisted(() => ({ appointment: { findUnique: vi.fn() } }));
const templates = vi.hoisted(() => ({
  confirmation: vi.fn(() => null),
  reschedule: vi.fn(() => null),
  cancellation: vi.fn(() => null),
  reminder: vi.fn(() => null),
  admin: vi.fn(() => null),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));
vi.mock("@react-email/render", () => ({ render: vi.fn(async () => "x") }));
vi.mock("../prisma", () => ({ prisma: db }));
vi.mock("@/components/emails/AppointmentConfirmationEmail", () => ({
  default: templates.confirmation,
}));
vi.mock("@/components/emails/AppointmentRescheduleEmail", () => ({
  default: templates.reschedule,
}));
vi.mock("@/components/emails/AppointmentCancellationEmail", () => ({
  default: templates.cancellation,
}));
vi.mock("@/components/emails/AppointmentReminderEmail", () => ({
  default: templates.reminder,
}));
vi.mock("@/components/emails/NewAppointmentAdminEmail", () => ({
  default: templates.admin,
}));

import {
  __resetEmailClient,
  sendBookingEmails,
  sendCancellationEmail,
  sendReminderEmail,
  sendRescheduleEmails,
} from "../email";

const SECRET = "HIV meds make my gums bleed";

function appointment(over: Record<string, unknown> = {}) {
  return {
    id: "appt_1",
    startsAt: new Date("2026-03-16T10:00:00Z"),
    date: new Date("2026-03-16T00:00:00Z"),
    time: "10:00",
    duration: 30,
    priceCents: null,
    reason: SECRET,
    cancelledBy: "PATIENT",
    cancelReason: null,
    user: {
      email: "pat@example.com",
      firstName: "Pat",
      lastName: "Lee",
      phone: null,
      deletedAt: null,
    },
    doctor: { name: "Dr Okafor" },
    service: null,
    ...over,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.RESEND_API_KEY = "re_test";
  process.env.ADMIN_EMAILS = "admin@clinic.example";
  __resetEmailClient();
  send.mockResolvedValue({ data: { id: "m1" }, error: null });
  db.appointment.findUnique.mockResolvedValue(appointment());
});

const subjects = () =>
  send.mock.calls.map((c) => (c[0] as { subject: string }).subject);
const typesPassed = () =>
  Object.values(templates).flatMap((t) =>
    t.mock.calls.map(
      (c) => (c as unknown as [{ appointmentType: string }])[0].appointmentType,
    ),
  );

describe("patient free text stays out of emails", () => {
  it("is not used as the subject or appointment type of any appointment email", async () => {
    await sendBookingEmails("appt_1");
    await sendRescheduleEmails("appt_0", "appt_1");
    await sendCancellationEmail("appt_1");
    await sendReminderEmail("appt_1", "24h");
    await sendReminderEmail("appt_1", "1h");

    expect(send).toHaveBeenCalledTimes(7);
    for (const subject of subjects()) expect(subject).not.toContain("HIV");
    expect(typesPassed()).toHaveLength(7);
    for (const type of typesPassed()) expect(type).toBe("Consultation");
  });

  it("uses the service name when there is one", async () => {
    db.appointment.findUnique.mockResolvedValue(
      appointment({ service: { name: "Teeth cleaning" } }),
    );
    await sendBookingEmails("appt_1");
    expect(subjects()[0]).toContain("Teeth cleaning");
    expect(typesPassed()).toEqual(["Teeth cleaning", "Teeth cleaning"]);
  });
});

describe("email logs carry no subject or recipient", () => {
  it("logs the template and appointment id when the provider rejects a send", async () => {
    send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "bad" },
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await sendCancellationEmail("appt_1");

    const logged = JSON.stringify(error.mock.calls);
    expect(logged).toContain("cancellation");
    expect(logged).toContain("appt_1");
    expect(logged).not.toContain("pat@example.com");
    expect(logged).not.toContain("Cancelled:");
  });

  it("logs the template and appointment id (not the raw error) when sending throws", async () => {
    send.mockRejectedValue(
      Object.assign(new Error("to pat@example.com refused"), {
        name: "NetworkError",
      }),
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await sendReminderEmail("appt_1", "24h");

    const logged = JSON.stringify(error.mock.calls);
    expect(logged).toContain("reminder-24h");
    expect(logged).toContain("appt_1");
    expect(logged).toContain("NetworkError");
    expect(logged).not.toContain("pat@example.com");
    expect(logged).not.toContain("Tomorrow:");
  });

  it("logs no subject when email is not configured", async () => {
    process.env.RESEND_API_KEY = "";
    __resetEmailClient();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendBookingEmails("appt_1");
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).toContain("appt_1");
    expect(logged).not.toContain("Booked:");
  });
});
