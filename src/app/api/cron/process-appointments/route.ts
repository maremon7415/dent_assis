import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const oneHourFromNow = new Date(now);
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    const tomorrowAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
        status: "CONFIRMED",
      },
      include: {
        user: true,
        doctor: true,
      },
    });

    const oneHourAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: oneHourFromNow,
          lte: new Date(oneHourFromNow.getTime() + 30 * 60000),
        },
        status: "CONFIRMED",
        reminderSent1Hour: false,
      },
      include: {
        user: true,
        doctor: true,
      },
    });

    let reminder24hCount = 0;
    let reminder1hCount = 0;

    for (const appointment of tomorrowAppointments) {
      if (!appointment.reminderSent24h && appointment.user.email) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/send-reminder-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userEmail: appointment.user.email,
                userName: appointment.user.firstName,
                doctorName: appointment.doctor.name,
                appointmentDate: appointment.date.toISOString().split("T")[0],
                appointmentTime: appointment.time,
                appointmentType: appointment.reason,
              }),
            },
          );

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSent24h: true },
          });

          reminder24hCount++;
        } catch (error) {
          console.error(
            `Failed to send 24h reminder for appointment ${appointment.id}:`,
            error,
          );
        }
      }
    }

    for (const appointment of oneHourAppointments) {
      if (appointment.user.email) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/send-reminder-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userEmail: appointment.user.email,
                userName: appointment.user.firstName,
                doctorName: appointment.doctor.name,
                appointmentDate: appointment.date.toISOString().split("T")[0],
                appointmentTime: appointment.time,
                appointmentType: appointment.reason,
              }),
            },
          );

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminderSent1Hour: true },
          });

          reminder1hCount++;
        } catch (error) {
          console.error(
            `Failed to send 1h reminder for appointment ${appointment.id}:`,
            error,
          );
        }
      }
    }

    return NextResponse.json({
      message: "Reminders processed successfully",
      remindersSent24h: reminder24hCount,
      remindersSent1h: reminder1hCount,
    });
  } catch (error) {
    console.error("Background job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
