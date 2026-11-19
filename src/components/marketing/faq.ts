import { siteConfig } from "@/config/site";

export type Faq = { id: string; q: string; a: string };
export type FaqGroup = { id: string; title: string; items: Faq[] };

const { minNoticeHours, bookingWindowDays } = siteConfig.clinic;
const hours: number = minNoticeHours;
const notice = `${hours} hour${hours === 1 ? "" : "s"}`;

/**
 * Answers are written from how the product actually behaves (booking rules from siteConfig, the
 * reminder job, what the voice assistant is given). Change the behaviour, change the answer.
 */
export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "booking",
    title: "Booking and visits",
    items: [
      {
        id: "how-to-book",
        q: "How do I book a visit?",
        a: `Create a free account, choose a treatment, pick a dentist who offers it and choose one of their open times. Only times that are genuinely free are shown, and a slot is held for one patient only, so two people can never book the same time. You can book up to ${bookingWindowDays} days ahead.`,
      },
      {
        id: "how-soon",
        q: "How soon can I be seen?",
        a: `Online booking opens ${notice} from now, so the front desk has time to prepare. For toothache, swelling or a broken tooth, book an emergency visit or call us on ${siteConfig.phone} and we will fit you in the same day where we can.`,
      },
      {
        id: "cancel",
        q: "Can I cancel or move my appointment?",
        a: `Yes. Open the patient portal and choose Reschedule or Cancel visit. You can do this online up to ${notice} before the start time. Closer than that, please call the clinic so we can offer the time to someone else.`,
      },
      {
        id: "reminders",
        q: "Will I get a reminder?",
        a: "You get a confirmation email as soon as you book, a reminder the day before (for visits booked more than a day ahead) and another about an hour before you are due. Changes and cancellations are confirmed by email too.",
      },
      {
        id: "first-visit",
        q: "What should I bring to my first visit?",
        a: "Bring a photo ID, a list of any medicines you take, and your dental insurance details if you have them. Arrive ten minutes early so we can go through your medical history with you.",
      },
    ],
  },
  {
    id: "assistant",
    title: "The AI voice assistant",
    items: [
      {
        id: "ai-what",
        q: "What can the AI assistant help with?",
        a: "It answers general dental questions by voice, at any hour: what a symptom might mean, how to manage pain until your visit, what a treatment involves and how to look after your teeth afterwards. It can help you decide whether something needs a dentist soon.",
      },
      {
        id: "ai-limits",
        q: "Can it diagnose me or replace a dentist?",
        a: "No. The assistant gives general guidance, never a diagnosis or a prescription, and it cannot see your mouth, your X-rays or your records. It cannot book, move or cancel visits for you either; you do that in the portal. In an emergency, call your local emergency number.",
      },
      {
        id: "ai-cost",
        q: "Is the assistant free?",
        a: "Booking and the patient portal are free. Voice conversations with the assistant are part of the AI plans, which you can start or cancel from the pricing page at any time.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy and payment",
    items: [
      {
        id: "data",
        q: "What happens to my information?",
        a: `Your details and appointment history are visible only to you and to clinic staff who care for you. Other patients never see who is booked. The voice assistant is not given your records. To correct or remove your information, email ${siteConfig.supportEmail}.`,
      },
      {
        id: "payment",
        q: "How do I pay for treatment?",
        a: "Treatment is paid at the clinic after your visit. The prices on the services page are our standard fees; your dentist confirms the cost of anything extra before starting. AI plan subscriptions are billed separately, by card, through your account.",
      },
    ],
  },
];

export const ALL_FAQS = FAQ_GROUPS.flatMap((g) => g.items);

export function faqById(id: string) {
  return ALL_FAQS.find((f) => f.id === id);
}

export function faqJsonLd(items: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
