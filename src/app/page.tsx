import { SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div>
      <h1>Home page</h1>
      <SignInButton mode="modal">Sign-In </SignInButton>
    </div>
  );
}
