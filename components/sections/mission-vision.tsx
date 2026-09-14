"use client"

import { motion } from "framer-motion"
import { Target, Eye } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function MissionVision() {
    const { data: contentData } = useContent()
    const missionData = contentData?.find((item: any) => item.section === 'mission')
    const visionData = contentData?.find((item: any) => item.section === 'vision')

    const mission = missionData || {
        title: "Our Mission",
        subtitle: "Service Excellence",
        content: "To provide a highly motivated, professional and efficient workforce for the Local Government Service through effective recruitment, training, and management, ensuring excellence in service delivery at the grassroots level."
    }

    const vision = visionData || {
        title: "Our Vision",
        subtitle: "Future Outlook",
        content: "To be a world-class Local Government Service Commission that ensures transparency, accountability, and sustainable development across all 18 Local Government Areas of Edo State."
    }

    const items = [
        {
            title: mission.title,
            description: mission.content,
            icon: Target,
            color: "text-primary",
            bg: "bg-primary/10"
        },
        {
            title: vision.title,
            description: vision.content,
            icon: Eye,
            color: "text-accent",
            bg: "bg-accent/10"
        }
    ]

    return (
        <section id="mission-vision" className="py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-b from-background to-card/50">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Mission & Vision</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Our commitment to excellence and service delivery in Edo State
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="relative group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden"
                        >
                            <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-4">{item.title}</h3>
                            <div className="text-muted-foreground leading-relaxed">
                                <RichTextDisplay content={item.description} />
                            </div>

                            {/* Decorative background element */}
                            <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
