import { Heading, Text } from "@react-email/components";
import {
  appUrl,
  DetailRow,
  EmailLayout,
  PrimaryButton,
  styles,
} from "./EmailLayout";

export interface AppointmentCancellationEmailProps {
  userName?: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  /** Who cancelled, shown in plain words. */
  cancelledByClinic?: boolean;
  reason?: string | null;
}

export default function AppointmentCancellationEmail({
  userName,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  cancelledByClinic,
  reason,
}: AppointmentCancellationEmailProps) {
  return (
    <EmailLayout
      preview={`Cancelled: ${appointmentType} on ${appointmentDate}`}
    >
      <Heading style={styles.h1}>Your appointment is cancelled</Heading>
      <Text style={styles.text}>
        Hi {userName || "there"},{" "}
        {cancelledByClinic
          ? "we had to cancel the appointment below. We are sorry for the inconvenience."
          : "as requested, we cancelled the appointment below."}
      </Text>
      <div style={styles.warnPanel}>
        <DetailRow label="Treatment" value={appointmentType} />
        <DetailRow label="Dentist" value={doctorName} />
        <DetailRow label="Date" value={appointmentDate} />
        <DetailRow label="Time" value={appointmentTime} />
        <DetailRow label="Reason" value={reason} />
      </div>
      <PrimaryButton href={appUrl("/appointments")}>
        Book a new time
      </PrimaryButton>
    </EmailLayout>
  );
}
