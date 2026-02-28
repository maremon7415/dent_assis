import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, reason } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by user",
      },
      include: {
        user: true,
        doctor: true,
      },
    });

    if (appointment.user.email) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/send-cancellation-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: appointment.user.email,
              userName: appointment.user.firstName,
              doctorName: appointment.doctor.name,
              appointmentDate: appointment.date.toISOString().split("T")[0],
              appointmentTime: appointment.time,
              appointmentType: appointment.reason || "Dental Checkup",
            }),
          },
        );
      } catch (error) {
        console.error("Failed to send cancellation email:", error);
      }
    }

    return NextResponse.json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
