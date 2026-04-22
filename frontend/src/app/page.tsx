import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { SocialProof } from "@/components/sections/SocialProof";
import { SplitSection } from "@/components/sections/SplitSection";
import { DarkShowcase } from "@/components/sections/DarkShowcase";
import { FeatureMini } from "@/components/sections/FeatureMini";
import { TrustSection } from "@/components/sections/TrustSection";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-green-200 selection:text-green-900 font-sans">
      <Navbar />
      
      <main>
        <Hero />
        <SocialProof />
        
        {/* Features mapped from SmartAssess capabilities */}
        <SplitSection 
          title="Interactive Exam Workspace"
          description="Navigate through questions using a dynamic palette. Switch seamlessly between Coding and MCQ views without losing state."
          visual={
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm aspect-video flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-green-400" />
              <div className="flex gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-gray-200" />
                <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center text-xs">2</div>
                <div className="w-8 h-8 rounded bg-green-500" />
              </div>
              <div className="flex-1 bg-white rounded-lg border border-gray-100 p-4">
                <div className="w-3/4 h-4 bg-gray-100 rounded mb-2" />
                <div className="w-1/2 h-4 bg-gray-100 rounded" />
              </div>
            </div>
          }
        />

        <SplitSection 
          reverse
          bg="bg-gray-50/50"
          title="Deterministic Server Locking"
          description="Exams transition states automatically. A robust backend state machine ensures exams close securely, preventing unauthorized access."
          visual={
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">Status</div>
                <div className="text-2xl font-bold text-gray-900">CLOSED</div>
              </div>
            </div>
          }
        />

        <DarkShowcase />

        <FeatureMini />

        <TrustSection />

        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}