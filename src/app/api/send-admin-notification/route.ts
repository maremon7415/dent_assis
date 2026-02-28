import { NextResponse } from "next/server";
import NewAppointmentAdminEmail from "@/components/emails/NewAppointmentAdminEmail";
import resend from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 },
      );
    }

    const {
      doctorName,
      patientName,
      patientEmail,
      patientPhone,
      appointmentDate,
      appointmentTime,
      appointmentType,
    } = body;

    if (!doctorName || !patientName || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Dent-Assist <no-reply@dev.emon.pro>",
      to: [adminEmail],
      subject: `New Appointment: ${patientName} booked with ${doctorName}`,
      react: NewAppointmentAdminEmail({
        doctorName,
        patientName,
        patientEmail: patientEmail || "N/A",
        patientPhone: patientPhone || "N/A",
        appointmentDate,
        appointmentTime,
        appointmentType: appointmentType || "Dental Checkup",
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send admin notification" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Admin notification sent successfully", emailId: data?.id },
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
