import { NextResponse } from "next/server";
import AppointmentCancellationEmail from "@/components/emails/AppointmentCancellationEmail";
import resend from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userEmail,
      userName,
      doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType,
    } = body;

    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Dent-Assist <no-reply@dev.emon.pro>",
      to: [userEmail],
      subject: "Your appointment has been cancelled - Dent-Assist",
      react: AppointmentCancellationEmail({
        userName: userName || "Patient",
        doctorName,
        appointmentDate,
        appointmentTime,
        appointmentType: appointmentType || "Dental Checkup",
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send cancellation email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Cancellation email sent successfully", emailId: data?.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
