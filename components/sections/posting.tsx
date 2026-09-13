"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, MapPin, FileText, RefreshCw, ChevronDown } from "lucide-react"
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
    image: string | null
}

export default function PostingSection() {
    const [content, setContent] = useState<SectionContent>({
        title: "Posting",
        subtitle: "Staff Movement & Posting",
        content: "The Commission manages the posting and transfer of staff across all Local Government Areas. This ensures optimal distribution of human resources, skill matching, and balanced workforce deployment throughout Edo State Local Government Service."
    })

    const [highlights, setHighlights] = useState<Highlight[]>([])
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
                const sectionData = data.find((item: SectionContent & { section: string }) => item.section === 'posting')
                if (sectionData) {
                    setContent({
                        title: "Posting", // Force title to Posting as requested, or use sectionData.title if updated in DB
                        subtitle: sectionData.subtitle || "Staff Movement & Posting",
                        content: sectionData.content
                    })
                }
            }
        } catch (error) {
        }
    }

    const fetchHighlights = async () => {
        try {
            const response = await fetch('/api/highlights?type=POSTING')
            if (response.ok) {
                const data = await response.json()
                setHighlights(data)
            }
        } catch (error) {
        }
    }

    return (
        <section id="posting" className="py-20 px-4 md:px-8 lg:px-12 bg-linear-to-br from-background via-card to-background">
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
                        <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-full mb-4">
                            {content.subtitle}
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                            {content.title}
                        </h2>
                        <div className="text-lg text-muted-foreground leading-relaxed mb-8">
                            <RichTextDisplay content={content.content} />
                        </div>
                    </motion.div>

                    {/* Postings List */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <div className="bg-linear-to-r from-accent to-primary p-6 rounded-2xl text-white mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ArrowRight className="w-6 h-6" />
                                Recent Postings
                            </h3>
                            <p className="text-white/80 text-sm mt-1">
                                Recent staff transfers and deployments across LGAs
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {highlights.slice(0, 3).map((staff, index) => (
                                <motion.div
                                    key={staff.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all flex items-center gap-4 group"
                                >
                                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                                        <MapPin className="w-6 h-6 text-accent group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground text-lg truncate">{staff.title}</h4>
                                        <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
                                            <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium text-xs">
                                                {staff.subtitle.includes('→') ? staff.subtitle.split('→')[0].trim() : staff.subtitle}
                                            </span>
                                            {staff.subtitle.includes('→') && (
                                                <>
                                                    <ArrowRight className="w-4 h-4 text-accent" />
                                                    <span className="bg-accent/10 text-accent px-2 py-0.5 rounded font-bold text-xs">
                                                        {staff.subtitle.split('→')[1].trim()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {staff.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {highlights.length > 3 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                onClick={() => router.push('/postings')}
                                className="w-full py-3 mt-6 bg-accent/10 hover:bg-accent/20 text-accent font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <>
                                    <span>View More</span>
                                    <ChevronDown className="w-4 h-4" />
                                </>
                            </motion.button>
                        )}

                        {highlights.length === 0 && (
                            <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                                <p className="text-muted-foreground">No recent postings to display.</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
