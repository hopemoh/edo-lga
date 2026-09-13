"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import RichTextDisplay from "@/components/ui/rich-text-display"

interface AboutContent {
  title: string
  subtitle: string
  content: string
}

export default function About() {
  const [content, setContent] = useState<AboutContent>({
    title: "The Heartbeat of Nigeria",
    subtitle: "Our Heritage",
    content: "Edo State stands as a beacon of African heritage and cultural pride. Home to the historic Kingdom of Benin, the state is renowned for its magnificent Oba's Palace, intricate bronze works, and rich artistic traditions that have captivated the world for centuries."
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content')
      if (response.ok) {
        const data = await response.json()
        const aboutData = data.find((item: any) => item.section === 'about')
        if (aboutData) {
          setContent({
            title: aboutData.title,
            subtitle: aboutData.subtitle || "Our Heritage",
            content: aboutData.content
          })
        }
      }
    } catch (error) {
    }
  }

  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-red-gradient-to-br from-background via-card to-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-lg font-medium mb-3 tracking-wide">{content.subtitle}</p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">{content.title}</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Cultural Richness</h3>
            <div className="text-muted-foreground leading-relaxed">
              <RichTextDisplay content={content.content} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Economic Vitality</h3>
            <p className="text-muted-foreground leading-relaxed">
              Beyond its cultural significance, Edo State is a thriving economic hub. From agriculture and commerce to
              arts and crafts, the 18 Local Government Areas work together to drive sustainable development and improve
              the quality of life for millions of residents.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
        >
          {[
            { number: "18", label: "Local Government Areas" },
            { number: "4.3M", label: "Population" },
            { number: "17K", label: "Square Kilometers" },
            { number: "60+", label: "Years of Heritage" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4">
              <p className="text-3xl font-bold text-primary mb-2">{stat.number}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
