import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";

/** Brand colours for email (inline styles only; email clients ignore CSS variables). */
export const emailColors = {
  primary: "#0E7C7B",
  primaryDark: "#0A5F5E",
  ink: "#0B2A33",
  muted: "#4B6470",
  enamel: "#FAF8F4",
  card: "#FFFFFF",
  border: "#E3E8E6",
  mint: "#E6F5F1",
  coral: "#C2543F",
  coralSoft: "#FBEDE9",
} as const;

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const styles = {
  h1: {
    color: emailColors.ink,
    fontSize: "24px",
    lineHeight: "32px",
    fontWeight: 700,
    margin: "0 0 16px",
  },
  text: {
    color: emailColors.ink,
    fontSize: "16px",
    lineHeight: "26px",
    margin: "0 0 16px",
  },
  muted: {
    color: emailColors.muted,
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 12px",
  },
  label: {
    color: emailColors.muted,
    fontSize: "12px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    margin: "0 0 2px",
  },
  value: {
    color: emailColors.ink,
    fontSize: "16px",
    fontWeight: 600,
    margin: "0 0 14px",
  },
  panel: {
    backgroundColor: emailColors.mint,
    borderRadius: "12px",
    padding: "20px 24px 6px",
    margin: "8px 0 24px",
  },
  warnPanel: {
    backgroundColor: emailColors.coralSoft,
    borderRadius: "12px",
    padding: "20px 24px 6px",
    margin: "8px 0 24px",
  },
} as const;

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </>
  );
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center", margin: "8px 0 24px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: emailColors.primary,
          borderRadius: "999px",
          color: "#FFFFFF",
          fontSize: "15px",
          fontWeight: 600,
          padding: "12px 24px",
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

export function appUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}

/** Shared shell: text wordmark (no hotlinked images), content card, contact footer. */
export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: emailColors.enamel,
          fontFamily: fontStack,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "0 16px" }}
        >
          <Section style={{ padding: "8px 0 20px" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: emailColors.ink,
              }}
            >
              <span style={{ color: emailColors.primary }}>●</span>{" "}
              {siteConfig.name}
            </Text>
          </Section>
          <Section
            style={{
              backgroundColor: emailColors.card,
              border: `1px solid ${emailColors.border}`,
              borderRadius: "16px",
              padding: "32px 28px 12px",
            }}
          >
            {children}
          </Section>
          <Hr
            style={{ borderColor: emailColors.border, margin: "24px 0 12px" }}
          />
          <Text style={{ ...styles.muted, textAlign: "center" }}>
            {siteConfig.name} · {siteConfig.address}
            <br />
            {siteConfig.phone} · {siteConfig.supportEmail}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
