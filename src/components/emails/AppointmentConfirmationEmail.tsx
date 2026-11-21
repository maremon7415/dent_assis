import { Heading, Text } from "@react-email/components";
import { siteConfig } from "@/config/site";
import {
  appUrl,
  DetailRow,
  EmailLayout,
  PrimaryButton,
  styles,
} from "./EmailLayout";

export interface AppointmentConfirmationEmailProps {
  userName?: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  /** e.g. "45 min" */
  duration?: string;
  /** formatted price, e.g. "$120.00" */
  price?: string;
}

export default function AppointmentConfirmationEmail({
  userName,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  duration,
  price,
}: AppointmentConfirmationEmailProps) {
  return (
    <EmailLayout
      preview={`Booked: ${appointmentType} with ${doctorName} on ${appointmentDate}`}
    >
      <Heading style={styles.h1}>Your appointment is booked</Heading>
      <Text style={styles.text}>
        Hi {userName || "there"}, here are your details.
      </Text>
      <div style={styles.panel}>
        <DetailRow label="Treatment" value={appointmentType} />
        <DetailRow label="Dentist" value={doctorName} />
        <DetailRow label="Date" value={appointmentDate} />
        <DetailRow label="Time" value={appointmentTime} />
        <DetailRow label="Duration" value={duration} />
        <DetailRow label="Price" value={price} />
        <DetailRow label="Where" value={siteConfig.address} />
      </div>
      <Text style={styles.muted}>
        Please arrive 10 minutes early. You can reschedule or cancel online up
        to {siteConfig.clinic.minNoticeHours} hours before your visit.
      </Text>
      <PrimaryButton href={appUrl("/appointments")}>
        Manage appointment
      </PrimaryButton>
    </EmailLayout>
  );
}
