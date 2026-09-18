"use client"

import { motion } from "framer-motion"
import { FileBarChart, Download, Calendar, Users, Award, ArrowUpRight, RefreshCw, GraduationCap } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function AnnualReportSection() {
    const { data: contentData } = useContent()
    const sectionData = contentData?.find((item: any) => item.section === 'annual-report')
    const meta = sectionData?.metadata || {}
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Transparency & Accountability", content: sectionData.content, reportFileUrl: meta.reportFileUrl }
        : { title: "2024 Annual Report", subtitle: "Transparency & Accountability", content: "The Local Government Service Commission publishes comprehensive annual reports detailing activities, achievements, and statistical data including Confirmations, Promotions, Conversions, Advancements, In-Service Training, Inter-Cadre Transfers, Exit from Service, and Disciplinary Cases.", reportFileUrl: null }

    // Report categories from the 2024 Annual Report
    const reportCategories = [
        { label: "Confirmations", description: "Confirmation of Appointments", icon: Award },
        { label: "Promotions", description: "Staff Career Advancement", icon: ArrowUpRight },
        { label: "Conversions", description: "Cadre Conversion & Upgrade", icon: RefreshCw },
        { label: "In-Service Training", description: "Capacity Building Programs", icon: GraduationCap }
    ]

    const recentReports = [
        {
            year: "2024",
            title: "EDO STATE ANNUAL REPORT",
            description: "Complete report with statistics, charts, and analysis",
            status: "Latest",
            downloadUrl: content.reportFileUrl || "/reports/2024-annual-report.pdf"
        }
    ]

    return (
        <section id="annual-report" className="py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-background via-card to-background">
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

                {/* Report Categories */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {reportCategories.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white text-center group hover:scale-105 transition-transform"
                        >
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <p className="font-bold mb-1">{item.label}</p>
                            <p className="text-xs text-white/70">{item.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Reports Download Section */}
                {content.reportFileUrl && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                            <FileBarChart className="w-6 h-6 text-primary" />
                            Download Annual Reports
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Access comprehensive reports on Local Government Service Commission activities
                        </p>
                    </div>
                    <div className="divide-y divide-border">
                        {recentReports.map((report, index) => (
                            <motion.div
                                key={report.year}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white">
                                        <Calendar className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{report.title}</h4>
                                        <p className="text-sm text-muted-foreground">{report.description}</p>
                                        <p className="text-xs text-primary font-medium mt-1">{report.year}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {report.status}
                                    </span>
                                    <a
                                        href={report.downloadUrl}
                                        download
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
                )}

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="mt-8 text-center"
                >
                    <p className="text-sm text-muted-foreground">
                        Reports include detailed statistics, pie charts, bar charts, and analysis for all 18 Local Government Areas.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
