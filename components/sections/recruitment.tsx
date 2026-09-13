"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { UserPlus, FileText, Users, CheckSquare } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"

interface SectionContent {
    title: string
    subtitle: string
    content: string
}

export default function RecruitmentSection() {
    const [content, setContent] = useState<SectionContent>({
        title: "Staff Recruitment",
        subtitle: "Building the Workforce",
        content: "The Commission oversees the recruitment of qualified personnel into the Local Government Service. Our transparent recruitment process ensures that the best candidates are selected to serve the people of Edo State."
    })

    useEffect(() => {
        fetchContent()
    }, [])

    const fetchContent = async () => {
        try {
            const response = await fetch('/api/content')
            if (response.ok) {
                const data = await response.json()
                const sectionData = data.find((item: SectionContent & { section: string }) => item.section === 'recruitment')
                if (sectionData) {
                    setContent({
                        title: sectionData.title,
                        subtitle: sectionData.subtitle || "Building the Workforce",
                        content: sectionData.content
                    })
                }
            }
        } catch (error) {
        }
    }

    const steps = [
        {
            step: "01",
            icon: FileText,
            title: "Application",
            description: "Submit applications through official channels with required documents."
        },
        {
            step: "02",
            icon: Users,
            title: "Screening",
            description: "Applications are reviewed for eligibility and shortlisting."
        },
        {
            step: "03",
            icon: CheckSquare,
            title: "Assessment",
            description: "Written exams and interviews to evaluate candidates."
        },
        {
            step: "04",
            icon: UserPlus,
            title: "Onboarding",
            description: "Successful candidates receive appointments and orientation."
        }
    ]

    return (
        <section id="recruitment" className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
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

                {/* Process Steps */}
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-accent to-primary" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                                viewport={{ once: true }}
                                className="relative text-center"
                            >
                                {/* Step Number Circle */}
                                <div className="relative z-10 mx-auto mb-6">
                                    <div className="w-20 h-20 bg-card border-2 border-primary rounded-full flex items-center justify-center mx-auto shadow-lg">
                                        <item.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center justify-center shadow-md">
                                        {item.step}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-6 py-3">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-sm text-muted-foreground">
                            Recruitment announcements are published on official government channels
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
