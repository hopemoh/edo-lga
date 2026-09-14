"use client"

import { motion } from "framer-motion"
import { ShieldAlert, Scale, FileWarning, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useContent } from "@/hooks/use-resources"

export default function DisciplineSection() {
    const { data: contentData } = useContent()
    const sectionData = contentData?.find((item: any) => item.section === 'discipline')
    const content = sectionData
        ? { title: sectionData.title, subtitle: sectionData.subtitle || "Ethics & Compliance", content: sectionData.content }
        : { title: "Disciplinary Cases & Sanctions", subtitle: "Ethics & Compliance", content: "The Commission handles disciplinary matters with fairness and in accordance with civil service rules. Our processes ensure that all staff adhere to established codes of conduct while protecting the rights of individuals within the Local Government Service." }

    const aspects = [
        {
            icon: ShieldAlert,
            title: "Fair Hearing",
            description: "Ensuring every staff member is given a fair opportunity to respond to queries and allegations."
        },
        {
            icon: Scale,
            title: "Sanctions",
            description: "Appropriate sanctions are applied for proven misconduct, ranging from warnings to dismissal."
        },
        {
            icon: FileWarning,
            title: "Case Review",
            description: "Thorough review of all disciplinary cases by the Commission to ensure justice and equity."
        },
        {
            icon: Lock,
            title: "Confidentiality",
            description: "Sensitive matters are handled with utmost discretion and privacy."
        }
    ]

    return (
        <section id="discipline" className="py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23228B22' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 bg-destructive/10 text-destructive text-sm font-medium rounded-full mb-4">
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
                    {aspects.map((aspect, index) => (
                        <motion.div
                            key={aspect.title}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-card border border-border rounded-2xl p-6 flex gap-5 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                                <aspect.icon className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{aspect.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{aspect.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Auth Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-muted to-muted/50 border border-border rounded-2xl p-8 text-center"
                >
                    <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Restricted Access</h3>
                    <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                        Detailed disciplinary records and query information are confidential.
                        Authorized personnel can access this information through the Staff Management Dashboard.
                    </p>
                    <Link href="/login">
                        <Button variant="default" className="gap-2">
                            <Lock className="w-4 h-4" />
                            Staff Login
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
