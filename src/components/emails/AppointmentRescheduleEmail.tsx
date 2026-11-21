import { Heading, Text } from "@react-email/components";
import {
  appUrl,
  DetailRow,
  EmailLayout,
  PrimaryButton,
  styles,
} from "./EmailLayout";

export interface AppointmentRescheduleEmailProps {
  userName?: string;
  doctorName: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  appointmentType: string;
}

export default function AppointmentRescheduleEmail({
  userName,
  doctorName,
  oldDate,
  oldTime,
  newDate,
  newTime,
  appointmentType,
}: AppointmentRescheduleEmailProps) {
  return (
    <EmailLayout
      preview={`Moved: ${appointmentType} is now ${newDate} at ${newTime}`}
    >
      <Heading style={styles.h1}>Your appointment has moved</Heading>
      <Text style={styles.text}>
        Hi {userName || "there"}, your new time is confirmed.
      </Text>
      <div style={styles.panel}>
        <DetailRow label="Treatment" value={appointmentType} />
        <DetailRow label="Dentist" value={doctorName} />
        <DetailRow label="New date" value={newDate} />
        <DetailRow label="New time" value={newTime} />
      </div>
      <Text style={styles.muted}>
        Previously: {oldDate} at {oldTime}. That time has been released.
      </Text>
      <PrimaryButton href={appUrl("/appointments")}>
        View appointment
      </PrimaryButton>
    </EmailLayout>
  );
}
