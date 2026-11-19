import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";

const COLUMNS: ReadonlyArray<{
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}> = [
  {
    title: "Care",
    links: [
      { href: "/services", label: "Services" },
      { href: "/dentists", label: "Our dentists" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Patients",
    links: [
      { href: "/appointments", label: "Book a visit" },
      { href: "/dashboard", label: "Patient portal" },
      { href: "/voice", label: "AI assistant" },
    ],
  },
  {
    title: "Clinic",
    links: [
      { href: "/about", label: "About us" },
      { href: "/faq", label: "FAQ" },
    ],
  },
];

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Public site footer: brand, link columns and the clinic's contact details from siteConfig. */
export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-sidebar text-sidebar-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="space-y-4 lg:col-span-4">
          <Logo size="md" />
          <p className="max-w-xs font-display text-xl leading-snug text-foreground">
            {siteConfig.tagline}
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5"
        >
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-foreground">
                {col.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="focus-ring rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <address className="space-y-3 text-sm not-italic lg:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">
            Visit or call
          </h2>
          <p className="flex gap-2.5 text-muted-foreground">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <span>{siteConfig.address}</span>
          </p>
          <p className="flex gap-2.5">
            <Phone
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <a
              href={telHref(siteConfig.phone)}
              className="focus-ring rounded-sm text-muted-foreground hover:text-foreground"
            >
              {siteConfig.phone}
            </a>
          </p>
          <p className="flex gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="focus-ring rounded-sm break-all text-muted-foreground hover:text-foreground"
            >
              {siteConfig.supportEmail}
            </a>
          </p>
        </address>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>
            AI answers are general guidance, not a diagnosis. In an emergency,
            call your local emergency number.
          </p>
        </div>
      </div>
    </footer>
  );
}
