"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { RefreshCw, ArrowUpCircle, FileCheck, GraduationCap, ArrowRight, ChevronDown } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent, useHighlights } from "@/hooks/use-resources"

export default function ConversionSection() {
    const { data: contentData } = useContent()
    const { data: highlights } = useHighlights("CONVERSION")
    const router = useRouter()

    if (!highlights || highlights.length === 0) return null

    const sectionData = contentData?.find((item: any) => item.section === 'conversion')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Career Progression", content: sectionData.content }
        : { title: "Cadre Conversion & Advancement", subtitle: "Career Progression", content: "Staff cadre conversion and advancement programs enable employees to transition between career paths or advance to higher cadres based on additional qualifications and demonstrated competence." }

    return (
        <section id="conversion" className="py-20 px-4 md:px-8 lg:px-12 bg-linear-to-br from-background via-card to-background">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                        {content.subtitle}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                        {content.title}
                    </h2>
                    <div className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        <RichTextDisplay content={content.content} />
                    </div>
                </motion.div>

                {/* Recent Conversions List */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 text-primary" />
                        Recent Conversions & Advancements
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(highlights || []).slice(0, 4).map((staff: any, index: number) => (
                            <motion.div
                                key={staff.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <span className="font-bold text-lg">{staff.title.charAt(0)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-foreground truncate">{staff.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-2">
                                            <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                                                {staff.subtitle.split('→')[0].trim()}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-primary" />
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                                {staff.subtitle.split('→')[1]?.trim() || 'Upgraded'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <FileCheck className="w-3 h-3" />
                                            {staff.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {(highlights || []).length > 4 && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            onClick={() => router.push('/conversions')}
                            className="w-full py-3 mt-8 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <>
                                <span>View More</span>
                                <ChevronDown className="w-4 h-4" />
                            </>
                        </motion.button>
                    )}
                </div>
            </div>
        </section>
    )
}
