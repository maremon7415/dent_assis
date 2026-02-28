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

interface AppointmentReminderEmailProps {
  userName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  clinicAddress: string;
}

function AppointmentReminderEmail({
  userName,
  doctorName,
  appointmentDate,
  appointmentTime,
  appointmentType,
  clinicAddress,
}: AppointmentReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Your dental appointment is coming up!</Preview>
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

          <Heading style={h1}>Appointment Reminder 🦷</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            This is a friendly reminder about your upcoming dental appointment:
          </Text>

          <Section style={appointmentDetails}>
            <Text style={detailLabel}>Doctor</Text>
            <Text style={detailValue}>{doctorName}</Text>

            <Text style={detailLabel}>Appointment Type</Text>
            <Text style={detailValue}>{appointmentType}</Text>

            <Text style={detailLabel}>Date</Text>
            <Text style={detailValue}>{appointmentDate}</Text>

            <Text style={detailLabel}>Time</Text>
            <Text style={detailValue}>{appointmentTime}</Text>

            <Text style={detailLabel}>Location</Text>
            <Text style={detailValue}>{clinicAddress}</Text>
          </Section>

          <Section style={tipsContainer}>
            <Text style={tipsTitle}>Tips for your visit:</Text>
            <ul style={tipsList}>
              <li style={tipItem}>Please arrive 15 minutes early</li>
              <li style={tipItem}>Bring your insurance card (if applicable)</li>
              <li style={tipItem}>
                List any medications you're currently taking
              </li>
              <li style={tipItem}>Write down any questions for your dentist</li>
            </ul>
          </Section>

          <Text style={text}>
            Need to reschedule? You can manage your appointment from your
            dashboard.
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
            See you soon!
            <br />
            The Dent-Assist Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AppointmentReminderEmail;

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

const detailValue = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const tipsContainer: Record<string, unknown> = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const tipsTitle = {
  color: "#92400e",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const tipsList = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
  paddingLeft: "20px",
};

const tipItem: Record<string, string> = {
  color: "#92400e",
  fontSize: "14px",
  marginBottom: "8px",
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

const footer = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "32px 0 16px 0",
};
