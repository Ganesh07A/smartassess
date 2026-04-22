"use client";

import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export function Hero() {
  const { userId } = useAuth();

  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      {/* Subtle Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-green-200 rounded-full blur-[120px] opacity-30 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-200 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      <Container className="relative z-10 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-7xl md:text-8xl font-bold tracking-tight text-black"
        >
          Learn. <br />
          <span className="bg-gradient-to-r from-green-500 to-blue-500 text-transparent bg-clip-text">by doing.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-8 text-xl text-gray-600 max-w-2xl mx-auto"
        >
          Experience next-gen assessments with AI-powered evaluation, real-time coding, and instant results.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-12 flex items-center justify-center gap-4"
        >
          {!userId ? (
            <SignInButton mode="modal" fallbackRedirectUrl="/student">
              <Button size="lg" className="w-[200px]">Get Started</Button>
            </SignInButton>
          ) : (
            <Link href="/student">
              <Button size="lg" className="w-[200px]">Go to Dashboard</Button>
            </Link>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
