"use client"

import { useState } from "react"
import Navigation from "@/components/navigation"
import Hero from "@/components/hero"
import ExecutivesSection from "@/components/sections/executives"
import EdoMap from "@/components/edo-map"
import LGADetailModal from "@/components/lga-detail-modal"
import AppointmentsSection from "@/components/sections/appointments"
import PostingSection from "@/components/sections/posting"
import PromotionsSection from "@/components/sections/promotions"
import ConversionSection from "@/components/sections/conversion"
import TrainingSection from "@/components/sections/training"
import DisciplineSection from "@/components/sections/discipline"
import RecruitmentSection from "@/components/sections/recruitment"
import MonitoringSection from "@/components/sections/monitoring"
import PetitionsSection from "@/components/sections/petitions"
import AnnualReportSection from "@/components/sections/annual-report"
import JuniorStaffSection from "@/components/sections/junior-staff"
import About from "@/components/about"
import MissionVision from "@/components/sections/mission-vision"
import Footer from "@/components/footer"

interface LGA {
  id: string
  name: string
  description: string
  landmarks: string[]
  activities: string[]
  image: string
  mapX: number
  mapY: number
}

export default function Home() {
  const [selectedLGA, setSelectedLGA] = useState<LGA | null>(null)

  const scrollToMap = () => {
    const mapElement = document.getElementById("map-section")
    if (mapElement) {
      const offset = 80
      const elementPosition = mapElement.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth"
      })
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section id="hero">
        <Hero onDiscoverClick={scrollToMap} />
      </section>

      {/* Executives Section */}
      <ExecutivesSection />

      {/* Mission & Vision Section */}
      <MissionVision />

      {/* Map Section */}
      <section id="map-section" className="py-16 px-4 md:px-8 lg:px-12 scroll-mt-20">
        <div className="flex flex-col max-w-7xl mx-auto">
          <EdoMap onLGASelect={setSelectedLGA} />
        </div>
      </section>

      {selectedLGA && <LGADetailModal lga={selectedLGA} onClose={() => setSelectedLGA(null)} />}

      {/* Administrative Sections */}
      <AppointmentsSection />
      <PostingSection />
      <PromotionsSection />
      <ConversionSection />
      <TrainingSection />
      <DisciplineSection />
      <RecruitmentSection />
      <MonitoringSection />
      <PetitionsSection />
      <AnnualReportSection />
      <JuniorStaffSection />

      {/* About Section */}
      <section id="about">
        <About />
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
