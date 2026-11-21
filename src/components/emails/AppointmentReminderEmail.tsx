import { Heading, Text } from "@react-email/components";
import { siteConfig } from "@/config/site";
import {
  appUrl,
  DetailRow,
  EmailLayout,
  PrimaryButton,
  styles,
} from "./EmailLayout";

export interface AppointmentReminderEmailProps {
  userName?: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  clinicAddress?: string;
  /** "24h" for the day-before reminder, "1h" for the same-day one. */
  window?: "24h" | "1h";
}

export default function AppointmentReminderEmail({
  userName,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  clinicAddress = siteConfig.address,
  window = "24h",
}: AppointmentReminderEmailProps) {
  const soon = window === "1h";
  return (
    <EmailLayout
      preview={`${soon ? "Soon" : "Tomorrow"}: ${appointmentType} at ${appointmentTime}`}
    >
      <Heading style={styles.h1}>
        {soon ? "See you soon" : "Your visit is coming up"}
      </Heading>
      <Text style={styles.text}>
        Hi {userName || "there"}, a reminder of your appointment{" "}
        {soon ? "in about an hour" : "tomorrow"}.
      </Text>
      <div style={styles.panel}>
        <DetailRow label="Treatment" value={appointmentType} />
        <DetailRow label="Dentist" value={doctorName} />
        <DetailRow label="Date" value={appointmentDate} />
        <DetailRow label="Time" value={appointmentTime} />
        <DetailRow label="Where" value={clinicAddress} />
      </div>
      <Text style={styles.muted}>
        Need to change it? Call {siteConfig.phone}
        {soon
          ? "."
          : ` or reschedule online up to ${siteConfig.clinic.minNoticeHours} hours before.`}
      </Text>
      <PrimaryButton href={appUrl("/appointments")}>
        View appointment
      </PrimaryButton>
    </EmailLayout>
  );
}
