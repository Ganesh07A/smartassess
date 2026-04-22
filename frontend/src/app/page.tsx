import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { SocialProof } from "@/components/sections/SocialProof";
import { SplitSection } from "@/components/sections/SplitSection";
import { DarkShowcase } from "@/components/sections/DarkShowcase";
import { FeatureMini } from "@/components/sections/FeatureMini";
import { FinalCTA } from "@/components/sections/FinalCTA";
import CodeEditor from "@/components/sections/CodeEditor";
import PuzzleCard from "@/components/sections/PuzzleCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-green-200 selection:text-green-900 font-sans">
      <Navbar />
      
      <main>
        <Hero />
        <SocialProof />
        
        {/* Concept Section: Puzzle UI */}
        <SplitSection 
          title="Master Concepts Visually"
          description="Drag and drop elements to understand algorithms and program flows. Interactive puzzles make learning intuitive and engaging before you even write a line of code."
          visual={
            <div className="flex items-center justify-center w-full h-full bg-blue-50/50 rounded-2xl p-8 border border-blue-100">
              <PuzzleCard />
            </div>
          }
        />

        {/* Workspace Section: Code Editor */}
        <SplitSection 
          reverse
          bg="bg-gray-50/50"
          title="Real-time Code Execution"
          description="Write, run, and test your code instantly. Our integrated editor supports multiple languages and provides immediate feedback on your solutions."
          visual={
            <div className="flex items-center justify-center w-full h-full">
              <CodeEditor />
            </div>
          }
        />

        <FeatureMini />

        <DarkShowcase />

        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}