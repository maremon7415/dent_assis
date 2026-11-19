import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ServiceDTO } from "@/lib/actions/services";
import { BandTitle, Container, DataUnavailable } from "../primitives";
import { ServiceMenu } from "../ServiceMenu";

const SHOWN = 6;

export function ServicesTeaser({
  services,
}: {
  services: ServiceDTO[] | null;
}) {
  const categories = services
    ? new Set(services.map((s) => s.category)).size
    : 0;
  return (
    <section aria-labelledby="services-title" className="py-20 lg:py-28">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <BandTitle
              id="services-title"
              title="Clear treatments, clear prices"
              lede={
                services && services.length > 0
                  ? `${services.length} treatments across ${categories} areas of care, each with its time in the chair and its standard fee up front.`
                  : "Every treatment shows its time in the chair and its standard fee up front."
              }
            />
            {services && services.length > SHOWN ? (
              <Button
                asChild
                variant="link"
                className="mt-4 h-auto px-0 text-base"
              >
                <Link href="/services">
                  All {services.length} treatments
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="lg:col-span-8">
          {services === null ? (
            <DataUnavailable what="Treatments" />
          ) : services.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/60 px-6 py-10 text-center">
              <p className="font-display text-xl text-foreground">
                Our treatment list is being updated
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You can still book a visit and tell us what you need.
              </p>
              <Button asChild className="mt-5">
                <Link href="/appointments">Book a visit</Link>
              </Button>
            </div>
          ) : (
            <ServiceMenu items={services.slice(0, SHOWN)} />
          )}
        </div>
      </Container>
    </section>
  );
}
