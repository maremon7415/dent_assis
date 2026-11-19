import { Heading, Text } from "@react-email/components";
import {
  appUrl,
  DetailRow,
  EmailLayout,
  PrimaryButton,
  styles,
} from "./EmailLayout";

/** Not wired yet: there is no payment flow. Kept, rebranded, for when one is added. */
export interface PaymentConfirmationEmailProps {
  userName?: string;
  amount: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  appointmentType: string;
  invoiceNumber: string;
}

export default function PaymentConfirmationEmail({
  userName,
  amount,
  appointmentDate,
  appointmentTime,
  doctorName,
  appointmentType,
  invoiceNumber,
}: PaymentConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Receipt ${invoiceNumber}: ${amount}`}>
      <Heading style={styles.h1}>Payment received</Heading>
      <Text style={styles.text}>
        Hi {userName || "there"}, thank you. Here is your receipt.
      </Text>
      <div style={styles.panel}>
        <DetailRow label="Amount" value={amount} />
        <DetailRow label="Invoice" value={invoiceNumber} />
        <DetailRow label="Treatment" value={appointmentType} />
        <DetailRow label="Dentist" value={doctorName} />
        <DetailRow
          label="Date"
          value={`${appointmentDate} · ${appointmentTime}`}
        />
      </div>
      <PrimaryButton href={appUrl("/appointments")}>
        View appointments
      </PrimaryButton>
    </EmailLayout>
  );
}
