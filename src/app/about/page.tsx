import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import { CheckCircleIcon } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col pt-16">
            <Header />
            <main className="flex-1 w-full mx-auto px-6 py-20 bg-gradient-to-br from-background via-muted/5 to-primary/5">
                <div className="max-w-6xl mx-auto space-y-24">

                    {/* Mission Section */}
                    <section className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full relative z-10 transition-transform hover:scale-105 duration-300">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-primary">Our Mission</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Empowering your</span><br />
                                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">dental journey</span>
                            </h1>

                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Dent-Assist was founded with a simple goal: making professional dental guidance accessible, instant, and personalized for everyone. Our AI-driven platform bridges the gap between patient curiosity and expert dental care.
                            </p>
                        </div>

                        <div className="relative animate-in fade-in zoom-in-95 duration-1000">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl" />
                            <div className="glass-panel p-2 rounded-3xl">
                                <Image src="/hero.png" alt="Dent-Assist Mission" width={600} height={400} className="rounded-2xl w-full h-auto object-cover" />
                            </div>
                        </div>
                    </section>

                    {/* AI Technology Section */}
                    <section className="bg-gradient-to-br from-card/80 to-card/40 glass-panel rounded-3xl p-12 md:p-16 border border-primary/20 shadow-xl overflow-hidden relative">
                        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

                        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
                            <h2 className="text-3xl font-bold">Cutting-Edge AI Technology</h2>
                            <p className="text-muted-foreground text-lg">
                                Our voice assistant utilizes advanced natural language processing models fine-tuned specifically on verified dental documentation. It's capable of answering complex queries, understanding symptoms, and providing empathetic support—24/7.
                            </p>
                        </div>
                    </section>

                    {/* Why Choose Us */}
                    <section className="space-y-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Why choose Dent-Assist?</h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: "24/7 Availability", desc: "Our AI assistant never sleeps. Get dental advice precisely when you need it, day or night." },
                                { title: "Verified Network", desc: "We exclusively partner with highly-rated, verified local dental professionals for your care." },
                                { title: "Secure & Private", desc: "Your health queries and appointment data are encrypted and strictly protected." }
                            ].map((feature, i) => (
                                <div key={i} className="glass-panel p-8 rounded-2xl hover:shadow-primary/10 hover:shadow-xl hover:border-primary/40 transition-all duration-300">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                                        <CheckCircleIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>
            <Footer />
        </div>
    );
}
