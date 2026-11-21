import { Heading, Text } from "@react-email/components";
import {
  appUrl,
  DetailRow,
  EmailLayout,
  PrimaryButton,
  styles,
} from "./EmailLayout";

export interface NewAppointmentAdminEmailProps {
  doctorName: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  /** "booked" (default) or "rescheduled" */
  kind?: "booked" | "rescheduled";
}

export default function NewAppointmentAdminEmail({
  doctorName,
  patientName,
  patientEmail,
  patientPhone,
  appointmentDate,
  appointmentTime,
  appointmentType,
  kind = "booked",
}: NewAppointmentAdminEmailProps) {
  return (
    <EmailLayout
      preview={`${patientName} ${kind} ${appointmentType} with ${doctorName}`}
    >
      <Heading style={styles.h1}>
        {kind === "booked" ? "New booking" : "Booking moved"}
      </Heading>
      <div style={styles.panel}>
        <DetailRow label="Patient" value={patientName} />
        <DetailRow label="Email" value={patientEmail} />
        <DetailRow label="Phone" value={patientPhone} />
        <DetailRow label="Treatment" value={appointmentType} />
        <DetailRow label="Dentist" value={doctorName} />
        <DetailRow label="Date" value={appointmentDate} />
        <DetailRow label="Time" value={appointmentTime} />
      </div>
      <Text style={styles.muted}>
        You receive this because your address is in ADMIN_EMAILS.
      </Text>
      <PrimaryButton href={appUrl("/admin")}>Open admin</PrimaryButton>
    </EmailLayout>
  );
}
