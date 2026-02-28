import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import PricingSection from "@/components/landing/Pricing";

export default function PricingPage() {
    return (
        <div className="min-h-screen flex flex-col pt-16">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
                <div className="glass-panel rounded-3xl overflow-hidden mt-8 shadow-2xl relative shadow-primary/10 border-primary/20">
                    <PricingSection />
                </div>
            </main>
            <Footer />
        </div>
    );
}
