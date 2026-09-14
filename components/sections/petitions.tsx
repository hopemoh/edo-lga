"use client"

import { motion } from "framer-motion"
import { FileInput, MessageSquare, Clock, CheckCircle2 } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function PetitionsSection() {
    const { data: contentData } = useContent()
    const sectionData = contentData?.find((item: any) => item.section === 'petitions')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Grievance Resolution", content: sectionData.content }
        : { title: "Staff Petitions", subtitle: "Grievance Resolution", content: "The Commission provides a fair and transparent mechanism for staff to submit petitions and grievances. Every petition is carefully reviewed and addressed in accordance with established procedures." }

    const process = [
        {
            icon: FileInput,
            title: "Submission",
            description: "Petitions are submitted in writing with supporting documents through official channels."
        },
        {
            icon: MessageSquare,
            title: "Acknowledgement",
            description: "Receipt is acknowledged and petition is assigned for investigation."
        },
        {
            icon: Clock,
            title: "Review",
            description: "Thorough investigation and review by the appropriate committee."
        },
        {
            icon: CheckCircle2,
            title: "Resolution",
            description: "Decision communicated to all parties with reasons and any recommended actions."
        }
    ]

    return (
        <section id="petitions" className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Process Flow */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1"
                    >
                        <div className="space-y-6">
                            {process.map((step, index) => (
                                <motion.div
                                    key={step.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="relative flex gap-4"
                                >
                                    {/* Connecting Line */}
                                    {index < process.length - 1 && (
                                        <div className="absolute left-6 top-14 w-0.5 h-[calc(100%-2rem)] bg-gradient-to-b from-primary to-primary/30" />
                                    )}

                                    <div className="relative z-10 flex-shrink-0">
                                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                            <step.icon className="w-6 h-6 text-primary-foreground" />
                                        </div>
                                    </div>

                                    <div className="bg-card border border-border rounded-xl p-4 flex-1 hover:shadow-md transition-shadow">
                                        <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2"
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

                        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
                            <h4 className="font-bold text-foreground mb-3">Your Rights</h4>
                            <ul className="space-y-2">
                                {[
                                    "Right to fair hearing",
                                    "Right to representation",
                                    "Right to appeal decisions",
                                    "Right to timely response"
                                ].map((right, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                        {right}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
