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

interface AppointmentCancellationEmailProps {
  userName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
}

function AppointmentCancellationEmail({
  userName,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
}: AppointmentCancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment has been cancelled - Dent-Assist</Preview>
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

          <Heading style={h1}>Appointment Cancelled ❌</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Your dental appointment has been cancelled as requested. Here are
            the details:
          </Text>

          <Section style={appointmentDetails}>
            <Text style={detailLabel}>Doctor</Text>
            <Text style={detailValue}>{doctorName}</Text>

            <Text style={detailLabel}>Appointment Type</Text>
            <Text style={detailValue}>{appointmentType}</Text>

            <Text style={detailLabel}>Original Date</Text>
            <Text style={detailValue}>{appointmentDate}</Text>

            <Text style={detailLabel}>Original Time</Text>
            <Text style={detailValue}>{appointmentTime}</Text>
          </Section>

          <Text style={text}>
            We're sorry to see you go! If you'd like to reschedule or book a new
            appointment, please visit our booking page.
          </Text>

          <Section style={ctaContainer}>
            <Link
              style={button}
              href={process.env.NEXT_PUBLIC_APP_URL + "/appointments"}
            >
              Book New Appointment
            </Link>
          </Section>

          <Text style={text}>
            If you didn't request this cancellation, please contact us
            immediately.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Dent-Assist Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AppointmentCancellationEmail;

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
