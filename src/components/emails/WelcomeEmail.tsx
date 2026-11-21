import { Heading, Text } from "@react-email/components";
import { siteConfig } from "@/config/site";
import { appUrl, EmailLayout, PrimaryButton, styles } from "./EmailLayout";

export interface WelcomeEmailProps {
  userName?: string;
}

export default function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${siteConfig.name}`}>
      <Heading style={styles.h1}>Welcome to {siteConfig.name}</Heading>
      <Text style={styles.text}>
        Hi {userName || "there"}, your account is ready. {siteConfig.tagline}
      </Text>
      <Text style={styles.text}>
        Book a visit with the right dentist in under a minute, keep your health
        details in one place, and see your visit notes after every appointment.
      </Text>
      <PrimaryButton href={appUrl("/appointments")}>
        Book your first visit
      </PrimaryButton>
      <Text style={styles.muted}>
        Questions? Reply to {siteConfig.supportEmail} or call {siteConfig.phone}
        .
      </Text>
    </EmailLayout>
  );
}
