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

interface WelcomeEmailProps {
  userName: string;
}

function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Dent-Assist - Your AI Dental Assistant</Preview>
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

          <Heading style={h1}>Welcome to Dent-Assist, {userName}! 🦷</Heading>

          <Text style={text}>
            We're thrilled to have you on board! Dent-Assist is your personal
            AI-powered dental assistant designed to help you maintain optimal
            oral health.
          </Text>

          <Section style={featuresContainer}>
            <Text style={featureTitle}>
              Here's what you can do with Dent-Assist:
            </Text>

            <div style={featureItem}>
              <Text style={featureIcon}>🤖</Text>
              <div>
                <Text style={featureHeading}>AI Voice Assistant</Text>
                <Text style={featureText}>
                  Get instant dental advice through voice calls, available 24/7
                </Text>
              </div>
            </div>

            <div style={featureItem}>
              <Text style={featureIcon}>📅</Text>
              <div>
                <Text style={featureHeading}>Easy Appointments</Text>
                <Text style={featureText}>
                  Book appointments with verified dentists in just a few clicks
                </Text>
              </div>
            </div>

            <div style={featureItem}>
              <Text style={featureIcon}>🔔</Text>
              <div>
                <Text style={featureHeading}>Smart Reminders</Text>
                <Text style={featureText}>
                  Never miss an appointment with automated reminders
                </Text>
              </div>
            </div>
          </Section>

          <Section style={ctaContainer}>
            <Link
              style={button}
              href={process.env.NEXT_PUBLIC_APP_URL + "/appointments"}
            >
              Book Your First Appointment
            </Link>
          </Section>

          <Text style={text}>
            If you have any questions, feel free to reach out to our support
            team. We're here to help!
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            The Dent-Assist Team
          </Text>

          <Text style={footerText}>
            © 2025 Dent-Assist. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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

const featuresContainer = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const featureTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px 0",
};

const featureItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "16px",
};

const featureIcon = {
  fontSize: "20px",
  margin: "0",
  width: "28px",
};

const featureHeading: Record<string, string> = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px 0",
};

const featureText: Record<string, string> = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
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

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
};
