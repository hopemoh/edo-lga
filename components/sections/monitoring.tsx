"use client"

import { motion } from "framer-motion"
import { Eye, ClipboardCheck, BarChart3, AlertTriangle } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function MonitoringSection() {
    const { data: contentData } = useContent()
    const sectionData = contentData?.find((item: any) => item.section === 'monitoring')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Oversight & Evaluation", content: sectionData.content }
        : { title: "Monitoring Team", subtitle: "Oversight & Evaluation", content: "The Monitoring Team ensures compliance with civil service rules and regulations across all LGAs. Regular inspections and evaluations help maintain standards and identify areas for improvement." }

    const activities = [
        {
            icon: Eye,
            title: "Regular Inspections",
            description: "Scheduled and surprise visits to LGAs to assess operations and compliance.",
            stat: "18",
            statLabel: "LGAs Covered"
        },
        {
            icon: ClipboardCheck,
            title: "Compliance Audits",
            description: "Thorough review of records, procedures, and staff conduct.",
            stat: "100%",
            statLabel: "Coverage Rate"
        },
        {
            icon: BarChart3,
            title: "Performance Reports",
            description: "Detailed reports and recommendations for continuous improvement.",
            stat: "Quarterly",
            statLabel: "Report Frequency"
        },
        {
            icon: AlertTriangle,
            title: "Issue Resolution",
            description: "Swift action on identified problems and irregularities.",
            stat: "48hrs",
            statLabel: "Response Time"
        }
    ]

    return (
        <section id="monitoring" className="py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-background via-card to-background">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-full mb-4">
                        {content.subtitle}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                        {content.title}
                    </h2>
                    <div className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        <RichTextDisplay content={content.content} />
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                                        <activity.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-foreground mb-2">{activity.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <p className="text-2xl font-bold text-primary">{activity.stat}</p>
                                    <p className="text-xs text-muted-foreground">{activity.statLabel}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
