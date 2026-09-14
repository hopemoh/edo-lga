"use client"

import { motion } from "framer-motion"
import { BookOpen, Users, Monitor, Award } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function TrainingSection() {
    const { data: contentData } = useContent()
    const sectionData = contentData?.find((item: any) => item.section === 'training')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Capacity Building", content: sectionData.content }
        : { title: "In-Service Training", subtitle: "Capacity Building", content: "The Commission organizes In-Service Training programs to enhance staff competencies and keep them updated with modern practices and technologies. Our training initiatives are key to effective service delivery across all Local Government Councils." }

    const programs = [
        {
            icon: BookOpen,
            title: "Induction Training",
            description: "Comprehensive orientation for newly recruited staff to understand civil service operations.",
            duration: "Ongoing"
        },
        {
            icon: Users,
            title: "Leadership Development",
            description: "Training programs designed for staff in supervisory and management positions.",
            duration: "Quarterly"
        },
        {
            icon: Monitor,
            title: "ICT Skills Training",
            description: "Computer literacy and digital skills training for enhanced productivity.",
            duration: "Continuous"
        },
        {
            icon: Award,
            title: "Professional Courses",
            description: "Sponsorship for professional certifications and advanced degree programs.",
            duration: "Annual"
        }
    ]

    return (
        <section id="training" className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
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

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {programs.map((program, index) => (
                        <motion.div
                            key={program.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                        >
                            {/* Header with Icon */}
                            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <program.icon className="w-7 h-7 text-primary-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">{program.title}</h3>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    {program.description}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <span className="text-xs text-muted-foreground">Duration</span>
                                    <span className="text-sm font-semibold text-primary">{program.duration}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
