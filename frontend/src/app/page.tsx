"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="relative bg-white text-gray-900 overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-green-300 rounded-full blur-[120px] opacity-40" />
      <div className="absolute bottom-[-120px] right-[-100px] w-[400px] h-[400px] bg-blue-300 rounded-full blur-[120px] opacity-40" />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-xl z-50 border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="font-bold text-xl">SmartAssess</h1>
          <div className="hidden md:flex gap-6 items-center">
            <a>Platform</a>
            <a>Features</a>
            <a>Docs</a>
            <button className="bg-green-500 text-white px-5 py-2 rounded-full hover:scale-105 transition">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-36 pb-28 text-center px-6 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-6xl md:text-7xl font-bold leading-tight"
        >
          Learn.
          <span className="bg-gradient-to-r from-green-500 to-blue-500 text-transparent bg-clip-text">
            {" "}Solve.
          </span>
          <br />
          Get Evaluated.
        </motion.h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Experience next-gen assessments with AI-powered evaluation,
          real-time coding, and instant results.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="bg-green-500 text-white px-7 py-3 rounded-full text-lg hover:scale-110 transition">
            Start Free
          </button>
          <button className="border px-7 py-3 rounded-full text-lg hover:bg-gray-100 transition">
            Watch Demo
          </button>
        </div>

        {/* FLOATING PROBLEM CARDS */}
        <div className="mt-24 flex justify-center gap-6 flex-wrap max-w-5xl mx-auto">
          {[1,2,3].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              whileHover={{ scale: 1.1 }}
              className="bg-white/60 backdrop-blur-lg border p-6 rounded-2xl shadow-xl w-[220px]"
            >
              <div className="h-24 rounded-lg bg-gradient-to-br from-green-300 to-blue-300 mb-4" />
              <p className="text-sm font-medium">
                Solve Problem #{i}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SCROLL STORY SECTION */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold">
              Interactive Exam Workspace
            </h2>
            <p className="mt-4 text-gray-600">
              Navigate through questions using a dynamic palette.
              Switch between coding & MCQ seamlessly.
            </p>
          </motion.div>

          {/* GLASS UI MOCK */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border"
          >
            <div className="flex gap-2 mb-4">
              <div className="h-3 w-3 bg-red-400 rounded-full" />
              <div className="h-3 w-3 bg-yellow-400 rounded-full" />
              <div className="h-3 w-3 bg-green-400 rounded-full" />
            </div>
            <div className="h-44 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Live Exam UI</p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">

          {[
            "AI Evaluation Engine",
            "Instant Marksheet Generator",
            "Auto Exam Locking",
            "Coding + MCQ Mode",
            "Analytics Dashboard",
            "CSV Bulk Upload"
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-6 rounded-2xl bg-white border shadow-md hover:shadow-xl transition"
            >
              <div className="h-12 w-12 bg-gradient-to-br from-green-300 to-blue-300 rounded-xl mb-4" />
              <h3 className="font-semibold text-lg">{f}</h3>
              <p className="text-sm text-gray-500 mt-2">
                Built for performance and real-world assessments.
              </p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 text-center px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-blue-200 opacity-30 blur-2xl" />

        <h2 className="text-5xl font-bold relative z-10">
          Start Your Smart Assessment Journey
        </h2>

        <button className="mt-8 bg-green-500 text-white px-10 py-4 rounded-full text-lg hover:scale-110 transition relative z-10">
          Get Started Now
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-gray-500">
        © 2026 SmartAssess
      </footer>

    </div>
  );
}