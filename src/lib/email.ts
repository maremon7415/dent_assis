/**
 * The only way the app sends email: server code renders a React Email template and sends it through
 * Resend. There is no public endpoint that sends mail.
 *
 * Without RESEND_API_KEY every send is logged and skipped. A send never throws: a provider outage
 * must not break a booking. Callers usually run these inside `defer()` so they happen after the response.
 */
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import AppointmentCancellationEmail from "@/components/emails/AppointmentCancellationEmail";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import AppointmentReminderEmail from "@/components/emails/AppointmentReminderEmail";
import AppointmentRescheduleEmail from "@/components/emails/AppointmentRescheduleEmail";
import NewAppointmentAdminEmail from "@/components/emails/NewAppointmentAdminEmail";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { siteConfig } from "@/config/site";
import { adminEmails, type EnvLike } from "./auth-shared";
import { prisma } from "./prisma";
import {
  formatClinicDate,
  formatClinicTime,
  formatMoney,
  legacyStartsAt,
} from "./time";

export type SendStatus = "sent" | "skipped" | "failed";

let client: Resend | null | undefined;
function resendClient(): Resend | null {
  if (client === undefined) {
    const key = process.env.RESEND_API_KEY;
    client = key ? new Resend(key) : null;
  }
  return client;
}

/** For tests. */
export function __resetEmailClient() {
  client = undefined;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Resend de-duplicates sends with the same key for 24h. */
  idempotencyKey?: string;
  /** Template name for logs, e.g. "cancellation". Logs never carry the subject or recipients. */
  template: string;
  /** The appointment or user id the email is about, for logs. */
  ref?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  idempotencyKey,
  template,
  ref,
}: SendEmailInput): Promise<SendStatus> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return "skipped";
  const what = `${template}${ref ? ` for ${ref}` : ""}`;

  const resend = resendClient();
  if (!resend) {
    console.info(`[email] RESEND_API_KEY not set; skipped ${what}`);
    return "skipped";
  }
  try {
    const [html, text] = await Promise.all([
      render(react),
      render(react, { plainText: true }),
    ]);
    const { error } = await resend.emails.send(
      {
        from: siteConfig.emailFrom,
        to: recipients,
        subject,
        html,
        text,
        replyTo: siteConfig.supportEmail,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    if (error) {
      // the provider's message can quote recipients; the error name is enough to triage
      console.error(`[email] provider rejected ${what}: ${error.name}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    const name = error instanceof Error ? error.name : typeof error;
    console.error(`[email] send failed for ${what}: ${name}`);
    return "failed";
  }
}

export function adminRecipients(env: EnvLike = process.env): string[] {
  return [...adminEmails(env)];
}

/** Welcome email, at most once per user (claimed on User.welcomeEmailSentAt). */
export async function sendWelcomeEmailOnce(
  userId: string,
): Promise<SendStatus> {
  const claimed = await prisma.user.updateMany({
    where: { id: userId, welcomeEmailSentAt: null, deletedAt: null },
    data: { welcomeEmailSentAt: new Date() },
  });
  if (claimed.count === 0) return "skipped";
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const status = await sendEmail({
    to: user.email,
    subject: `Welcome to ${siteConfig.name}`,
    react: WelcomeEmail({ userName: user.firstName ?? undefined }),
    idempotencyKey: `welcome/${user.id}`,
    template: "welcome",
    ref: user.id,
  });
  if (status === "failed") {
    await prisma.user.update({
      where: { id: userId },
      data: { welcomeEmailSentAt: null },
    });
  }
  return status;
}

async function loadAppointment(id: string) {
  const a = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          deletedAt: true,
        },
      },
      doctor: { select: { name: true } },
      service: { select: { name: true } },
    },
  });
  if (!a) return null;
  const startsAt = a.startsAt ?? legacyStartsAt(a.date, a.time) ?? a.date;
  return {
    appointment: a,
    startsAt,
    date: formatClinicDate(startsAt),
    time: formatClinicTime(startsAt),
    // Never the patient's free-text reason: it can hold health details and would land in subjects.
    type: a.service?.name ?? "Consultation",
    patientName:
      [a.user.firstName, a.user.lastName].filter(Boolean).join(" ") ||
      "Patient",
  };
}

export async function sendBookingEmails(appointmentId: string): Promise<void> {
  const v = await loadAppointment(appointmentId);
  if (!v || v.appointment.user.deletedAt) return;
  const { appointment: a } = v;
  await Promise.all([
    sendEmail({
      to: a.user.email,
      subject: `Booked: ${v.type} on ${v.date}`,
      react: AppointmentConfirmationEmail({
        userName: a.user.firstName ?? undefined,
        doctorName: a.doctor.name,
        appointmentDate: v.date,
        appointmentTime: v.time,
        appointmentType: v.type,
        duration: `${a.duration} min`,
        price: a.priceCents != null ? formatMoney(a.priceCents) : undefined,
      }),
      idempotencyKey: `booked/${a.id}`,
      template: "booking",
      ref: a.id,
    }),
    sendAdminNotification(v, "booked"),
  ]);
}

async function sendAdminNotification(
  v: NonNullable<Awaited<ReturnType<typeof loadAppointment>>>,
  kind: "booked" | "rescheduled",
) {
  const to = adminRecipients();
  if (to.length === 0) return "skipped" as const;
  const a = v.appointment;
  return sendEmail({
    to,
    subject: `${kind === "booked" ? "New booking" : "Rescheduled"}: ${v.patientName} with ${a.doctor.name}`,
    react: NewAppointmentAdminEmail({
      doctorName: a.doctor.name,
      patientName: v.patientName,
      patientEmail: a.user.email,
      patientPhone: a.user.phone ?? undefined,
      appointmentDate: v.date,
      appointmentTime: v.time,
      appointmentType: v.type,
      kind,
    }),
    idempotencyKey: `admin-${kind}/${a.id}`,
    template: `admin-${kind}`,
    ref: a.id,
  });
}

export async function sendRescheduleEmails(
  oldAppointmentId: string,
  newAppointmentId: string,
): Promise<void> {
  const [oldV, newV] = await Promise.all([
    loadAppointment(oldAppointmentId),
    loadAppointment(newAppointmentId),
  ]);
  if (!oldV || !newV || newV.appointment.user.deletedAt) return;
  const a = newV.appointment;
  await Promise.all([
    sendEmail({
      to: a.user.email,
      subject: `Moved: ${newV.type} is now ${newV.date} at ${newV.time}`,
      react: AppointmentRescheduleEmail({
        userName: a.user.firstName ?? undefined,
        doctorName: a.doctor.name,
        oldDate: oldV.date,
        oldTime: oldV.time,
        newDate: newV.date,
        newTime: newV.time,
        appointmentType: newV.type,
      }),
      idempotencyKey: `rescheduled/${a.id}`,
      template: "reschedule",
      ref: a.id,
    }),
    sendAdminNotification(newV, "rescheduled"),
  ]);
}

export async function sendCancellationEmail(
  appointmentId: string,
): Promise<SendStatus> {
  const v = await loadAppointment(appointmentId);
  if (!v || v.appointment.user.deletedAt) return "skipped";
  const a = v.appointment;
  return sendEmail({
    to: a.user.email,
    subject: `Cancelled: ${v.type} on ${v.date}`,
    react: AppointmentCancellationEmail({
      userName: a.user.firstName ?? undefined,
      doctorName: a.doctor.name,
      appointmentDate: v.date,
      appointmentTime: v.time,
      appointmentType: v.type,
      cancelledByClinic:
        a.cancelledBy === "ADMIN" || a.cancelledBy === "SYSTEM",
      reason: a.cancelledBy === "PATIENT" ? null : a.cancelReason,
    }),
    idempotencyKey: `cancelled/${a.id}`,
    template: "cancellation",
    ref: a.id,
  });
}

export async function sendReminderEmail(
  appointmentId: string,
  window: "24h" | "1h",
): Promise<SendStatus> {
  const v = await loadAppointment(appointmentId);
  if (!v || v.appointment.user.deletedAt) return "skipped";
  const a = v.appointment;
  return sendEmail({
    to: a.user.email,
    subject:
      window === "1h"
        ? `In about an hour: ${v.type} at ${v.time}`
        : `Tomorrow: ${v.type} at ${v.time}`,
    react: AppointmentReminderEmail({
      userName: a.user.firstName ?? undefined,
      doctorName: a.doctor.name,
      appointmentDate: v.date,
      appointmentTime: v.time,
      appointmentType: v.type,
      window,
    }),
    idempotencyKey: `reminder-${window}/${a.id}`,
    template: `reminder-${window}`,
    ref: a.id,
  });
}
