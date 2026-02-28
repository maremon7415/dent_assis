import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

function Header() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 px-6 py-2 glass-panel border-x-0 border-t-0 rounded-none h-16">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={"/logo.png"}
            alt="Dent-Assist Logo"
            width={32}
            height={32}
            className="w-11"
          />
          <span className="font-semibold text-lg">Dent-Assist</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <Button variant={"ghost"} size={"sm"}>
              Login
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size={"sm"}>Sign Up</Button>
          </SignUpButton>
        </div>
      </div>
    </nav>
  );
}
export default Header;
