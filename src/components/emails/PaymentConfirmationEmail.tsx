import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PaymentConfirmationEmailProps {
  userName: string;
  amount: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  appointmentType: string;
  invoiceNumber: string;
}

function PaymentConfirmationEmail({
  userName,
  amount,
  appointmentDate,
  appointmentTime,
  doctorName,
  appointmentType,
  invoiceNumber,
}: PaymentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment Confirmation - Dent-Assist</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://i.ibb.co.com/tRy6cC2/logo.png"
              width="50"
              height="50"
              alt="Dent-Assist"
              style={logo}
            />
            <Text style={logoText}>Dent-Assist</Text>
          </Section>

          <Heading style={h1}>Payment Confirmed! ✅</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Thank you for your payment. Your booking is now confirmed!
          </Text>

          <Section style={paymentDetails}>
            <Text style={paymentTitle}>Payment Receipt</Text>

            <div style={paymentRow}>
              <Text style={paymentLabel}>Invoice Number</Text>
              <Text style={paymentValue}>{invoiceNumber}</Text>
            </div>

            <div style={paymentRow}>
              <Text style={paymentLabel}>Amount Paid</Text>
              <Text style={paymentValueHighlight}>{amount}</Text>
            </div>

            <div style={paymentRow}>
              <Text style={paymentLabel}>Status</Text>
              <Text style={paymentStatus}>PAID</Text>
            </div>
          </Section>

          <Section style={appointmentDetails}>
            <Text style={detailLabel}>Doctor</Text>
            <Text style={detailValue}>{doctorName}</Text>

            <Text style={detailLabel}>Service</Text>
            <Text style={detailValue}>{appointmentType}</Text>

            <Text style={detailLabel}>Date</Text>
            <Text style={detailValue}>{appointmentDate}</Text>

            <Text style={detailLabel}>Time</Text>
            <Text style={detailValue}>{appointmentTime}</Text>
          </Section>

          <Text style={text}>
            Please arrive 15 minutes before your appointment time. Bring this
            email as confirmation.
          </Text>

          <Section style={ctaContainer}>
            <Link
              style={button}
              href={process.env.NEXT_PUBLIC_APP_URL + "/appointments"}
            >
              View My Appointments
            </Link>
          </Section>

          <Text style={footer}>
            Thank you for choosing Dent-Assist!
            <br />
            The Dent-Assist Team
          </Text>

          <Text style={footerText}>
            Questions? Contact us at support@dent-assist.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentConfirmationEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  borderRadius: "8px",
  display: "inline",
  verticalAlign: "middle",
};

const logoText = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#d87943",
  margin: "0",
  display: "inline",
  marginLeft: "12px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const paymentDetails = {
  backgroundColor: "#ecfdf5",
  border: "1px solid #a7f3d0",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const paymentTitle = {
  color: "#065f46",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const paymentRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const paymentLabel = {
  color: "#065f46",
  fontSize: "14px",
  margin: "0",
};

const paymentValue: Record<string, string> = {
  color: "#065f46",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
};

const paymentValueHighlight: Record<string, string> = {
  color: "#059669",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0",
};

const paymentStatus: Record<string, string> = {
  color: "#059669",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0",
};

const appointmentDetails = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "500",
  margin: "8px 0 4px 0",
};

const detailValue: Record<string, string> = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const ctaContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#d87943",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer: Record<string, string> = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "32px 0 16px 0",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
};
