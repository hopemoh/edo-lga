"use client"

import { motion } from "framer-motion"
import { Users2, Target, Handshake, MessageCircle } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function JuniorStaffSection() {
    const { data: contentData } = useContent()
    const sectionData = contentData?.find((item: any) => item.section === 'junior-staff')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Welfare & Representation", content: sectionData.content }
        : { title: "Junior Staff Committee", subtitle: "Welfare & Representation", content: "The Junior Staff Management Committee represents the interests of junior staff members across all Local Government Areas. The committee works to address welfare issues, promote fair treatment, and ensure the voice of junior staff is heard." }

    const functions = [
        {
            icon: Users2,
            title: "Staff Welfare",
            description: "Advocating for improved working conditions and benefits for junior staff."
        },
        {
            icon: MessageCircle,
            title: "Open Communication",
            description: "Facilitating dialogue between junior staff and management."
        },
        {
            icon: Handshake,
            title: "Conflict Resolution",
            description: "Mediating workplace disputes and promoting harmonious relations."
        },
        {
            icon: Target,
            title: "Career Development",
            description: "Advocating for training opportunities and career advancement."
        }
    ]

    return (
        <section id="junior-staff" className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
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

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {functions.map((func, index) => (
                        <motion.div
                            key={func.title}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-300">
                                    <func.icon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">{func.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{func.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Contact Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[gradient_3s_ease_infinite] rounded-2xl p-8 text-center text-white"
                >
                    <h3 className="text-2xl font-bold mb-3">Have Concerns?</h3>
                    <p className="text-white/90 max-w-xl mx-auto mb-6">
                        The Junior Staff Management Committee is here to listen and help.
                        Reach out to your LGA representative or contact the Commission directly.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">Contact Your Representative</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
