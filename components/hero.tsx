"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import RichTextDisplay from "@/components/ui/rich-text-display"

interface HeroProps {
  onDiscoverClick: () => void
}

interface HeroContent {
  title: string
  subtitle: string
  content: string
}

export default function Hero({ onDiscoverClick }: HeroProps) {
  const [content, setContent] = useState<HeroContent>({
    title: "Explore Edo State",
    subtitle: "The Heartbeat of Nigeria",
    content: "Immerse yourself in the rich cultural heritage, vibrant communities, and economic vitality of Edo State's 18 Local Government Areas"
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content')
      if (response.ok) {
        const data = await response.json()
        const heroData = data.find((item: any) => item.section === 'hero')
        if (heroData) {
          setContent({
            title: heroData.title,
            subtitle: heroData.subtitle || "The Heartbeat of Nigeria",
            content: heroData.content
          })
        }
      }
    } catch (error) {
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-secondary/30 to-background pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          <circle cx="150" cy="150" r="120" fill="url(#green-gradient-1)" />
          <circle cx="1050" cy="650" r="180" fill="url(#green-gradient-2)" />
          <circle cx="600" cy="400" r="100" fill="url(#green-gradient-3)" />
          <defs>
            <radialGradient id="green-gradient-1">
              <stop offset="0%" stopColor="#228B22" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="green-gradient-2">
              <stop offset="0%" stopColor="#2E8B57" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="green-gradient-3">
              <stop offset="0%" stopColor="#3CB371" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
        className="absolute top-32 left-10 w-24 h-24 rounded-full bg-primary/10 blur-xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-accent/10 blur-2xl"
      />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Edo State Local Government Service Commission
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight">
            {content.title}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mt-2">
              {content.subtitle}
            </span>
          </h1>
        </motion.div>

        <div className="max-w-3xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <RichTextDisplay
              content={content.content}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            size="lg"
            onClick={onDiscoverClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full font-semibold transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-105"
          >
            Explore LGAs
          </Button>
          <a href="#appointments" className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
            View Our Services
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}

