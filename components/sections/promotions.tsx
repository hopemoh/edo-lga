"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Star, CheckCircle, Award, ArrowUpRight, ChevronDown } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"

interface SectionContent {
    title: string
    subtitle: string
    content: string
}

interface Highlight {
    id: string
    title: string
    subtitle: string
    description: string
}

export default function PromotionsSection() {
    const [content, setContent] = useState<SectionContent>({
        title: "Staff Promotions",
        subtitle: "Career Advancement",
        content: "The Commission ensures fair and transparent promotion processes for all eligible staff members. Promotions are based on merit, performance, years of service, and fulfillment of required qualifications."
    })

    const [highlights, setHighlights] = useState<Highlight[]>([])
    const [showAll, setShowAll] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchContent()
        fetchHighlights()
    }, [])

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/content')
            if (response.ok) {
                const data = await response.json()
                const sectionData = data.find((item: SectionContent & { section: string }) => item.section === 'promotions')
                if (sectionData) {
                    setContent({
                        title: sectionData.title,
                        subtitle: sectionData.subtitle || "Career Advancement",
                        content: sectionData.content
                    })
                }
            }
        } catch (error) {
        }
    }

    const fetchHighlights = async () => {
        try {
            const response = await fetch('/api/highlights?type=PROMOTION')
            if (response.ok) {
                const data = await response.json()
                setHighlights(data)
            }
        } catch (error) {
        }
    }

    return (
        <section id="promotions" className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="lg:sticky lg:top-24"
                    >
                        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                            {content.subtitle}
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                            {content.title}
                        </h2>
                        <div className="text-lg text-muted-foreground leading-relaxed mb-8">
                            <RichTextDisplay content={content.content} />
                        </div>
                    </motion.div>

                    {/* Promotions List */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <div className="bg-linear-to-r from-primary to-accent p-6 rounded-2xl text-white mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ArrowUpRight className="w-6 h-6" />
                                Recently Promoted Staff
                            </h3>
                            <p className="text-white/80 text-sm mt-1">
                                Celebrating excellence and dedication in the Local Government Service
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {highlights.slice(0, 4).map((staff, index) => (
                                <motion.div
                                    key={staff.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <TrendingUp className="w-6 h-6 text-primary group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground text-lg truncate">{staff.title}</h4>
                                        <div className="flex items-center gap-2 text-sm mt-1">
                                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium text-xs">
                                                {staff.subtitle.split('→')[0].trim()}
                                            </span>
                                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-xs">
                                                {staff.subtitle.split('→')[1]?.trim() || 'Promoted'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <Award className="w-3 h-3" />
                                            {staff.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {highlights.length > 4 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                                onClick={() => router.push('/promotions')}
                                className="w-full py-3 mt-6 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <>
                                    <span>View More</span>
                                    <ChevronDown className="w-4 h-4" />
                                </>
                            </motion.button>
                        )}

                        {highlights.length === 0 && (
                            <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                                <p className="text-muted-foreground">No recent promotions to display.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
