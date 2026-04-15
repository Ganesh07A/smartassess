// src/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn
        fallbackRedirectUrl="/"   // ← Middleware handles role redirect from "/"
        signUpUrl="/sign-up"
      />
    </div>
  );
}