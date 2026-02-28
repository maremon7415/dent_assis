import { NextResponse } from "next/server";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import resend from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userEmail, userName } = body;

    if (!userEmail || !userName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Dent-Assist <no-reply@dev.emon.pro>",
      to: [userEmail],
      subject: "Welcome to Dent-Assist - Your AI Dental Assistant",
      react: WelcomeEmail({ userName }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Welcome email sent successfully", emailId: data?.id },
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
