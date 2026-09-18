"use client"

import { motion } from "framer-motion"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function About() {
  const { data: contentData } = useContent()
  const aboutData = contentData?.find((item: any) => item.section === 'about')
  const meta = aboutData?.metadata || {}
  const content = aboutData
    ? {
        title: aboutData.title,
        subtitle: aboutData.subtitle || "Our Heritage",
        culturalTitle: meta.culturalTitle || "Cultural Richness",
        culturalContent: meta.culturalContent || "Edo State stands as a beacon of African heritage and cultural pride. Home to the historic Kingdom of Benin, the state is renowned for its magnificent Oba's Palace, intricate bronze works, and rich artistic traditions that have captivated the world for centuries.",
        economicTitle: meta.economicTitle || "Economic Vitality",
        economicContent: meta.economicContent || "Beyond its cultural significance, Edo State is a thriving economic hub. From agriculture and commerce to arts and crafts, the 18 Local Government Areas work together to drive sustainable development and improve the quality of life for millions of residents.",
        stats: meta.stats && meta.stats.length > 0 ? meta.stats : [
          { number: "18", label: "Local Government Areas" },
          { number: "4.3M", label: "Population" },
          { number: "17K", label: "Square Kilometers" },
          { number: "60+", label: "Years of Heritage" },
        ]
      }
    : {
        title: "The Heartbeat of Nigeria",
        subtitle: "Our Heritage",
        culturalTitle: "Cultural Richness",
        culturalContent: "Edo State stands as a beacon of African heritage and cultural pride. Home to the historic Kingdom of Benin, the state is renowned for its magnificent Oba's Palace, intricate bronze works, and rich artistic traditions that have captivated the world for centuries.",
        economicTitle: "Economic Vitality",
        economicContent: "Beyond its cultural significance, Edo State is a thriving economic hub. From agriculture and commerce to arts and crafts, the 18 Local Government Areas work together to drive sustainable development and improve the quality of life for millions of residents.",
        stats: [
          { number: "18", label: "Local Government Areas" },
          { number: "4.3M", label: "Population" },
          { number: "17K", label: "Square Kilometers" },
          { number: "60+", label: "Years of Heritage" },
        ]
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
            <h3 className="text-2xl font-bold text-foreground">{content.culturalTitle}</h3>
            <div className="text-muted-foreground leading-relaxed">
              <RichTextDisplay content={content.culturalContent} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">{content.economicTitle}</h3>
            <div className="text-muted-foreground leading-relaxed">
              <RichTextDisplay content={content.economicContent} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
        >
          {content.stats.map((stat: { number: string; label: string }, i: number) => (
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
