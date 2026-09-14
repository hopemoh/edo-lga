"use client"

import { motion } from "framer-motion"
import { Users, Briefcase, Award, Calendar, UserCheck } from "lucide-react"
import { SignedImage } from "@/components/ui/signed-image"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent, useHighlights } from "@/hooks/use-resources"

export default function AppointmentsSection() {
    const { data: contentData } = useContent()
    const { data: highlights } = useHighlights("CONFIRMATION")

    const sectionData = contentData?.find((item: any) => item.section === 'appointments')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Staff Confirmation", content: sectionData.content }
        : { title: "Confirmation of Appointments", subtitle: "Staff Confirmation", content: "The Commission is responsible for the confirmation of appointments for staff across all Local Government Areas. This process ensures that qualified personnel are confirmed into the Local Government Service after meeting all necessary requirements." }

    return (
        <section id="appointments" className="py-20 px-4 md:px-8 lg:px-12 bg-muted/30">
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

                {/* Recently Confirmed Staff */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                        <UserCheck className="w-6 h-6 text-primary" />
                        Recently Confirmed Appointments
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(highlights || []).map((staff: any, index: number) => (
                            <motion.div
                                key={staff.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="aspect-4/3  bg-muted relative">
                                    {staff.image ? (
                                        <SignedImage
                                            src={staff.image}
                                            alt={staff.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                            <Users className="w-16 h-16 text-primary/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        CONFIRMED
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="text-lg font-bold text-foreground mb-1">{staff.title}</h4>
                                    <p className="text-primary font-medium text-sm mb-2">{staff.subtitle}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {staff.description}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
