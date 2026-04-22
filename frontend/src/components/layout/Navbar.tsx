"use client";

import Link from "next/link";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

export function Navbar() {
  const { userId } = useAuth();

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100">
      <Container className="flex justify-between items-center py-4">
        <Link href="/">
          <h1 className="font-bold text-2xl tracking-tight text-black">SmartAssess</h1>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#features" className="text-gray-600 hover:text-black transition">Features</Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-black transition">How it Works</Link>
          
          <div className="flex items-center gap-4">
            {!userId ? (
              <>
                <SignInButton mode="modal" fallbackRedirectUrl="/student">
                  <Button variant="ghost" size="sm">Log in</Button>
                </SignInButton>
                <SignInButton mode="modal" fallbackRedirectUrl="/student">
                  <Button variant="primary" size="sm">Get Started</Button>
                </SignInButton>
              </>
            ) : (
              <>
                <Link href="/student">
                  <Button variant="primary" size="sm">Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
}
