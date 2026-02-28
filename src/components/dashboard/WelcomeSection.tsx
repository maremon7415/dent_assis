import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";

export default async function WelcomeSection() {
  const user = await currentUser();

  return (
    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-primary/20 mb-8 sm:mb-12 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="space-y-3 sm:space-y-4 text-center sm:text-left w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <div className="size-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-primary">
            Online & Ready
          </span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
            , {user?.firstName}!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your personal AI dental assistant is ready to help you maintain
            perfect oral health.
          </p>
        </div>
      </div>

      <div className="lg:flex hidden items-center justify-center size-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full ">
        <Image
          src="/logo.png"
          alt="Dent-Assist"
          width={64}
          height={64}
          className="w-16 h-16"
        />
      </div>
    </div>
  );
}
