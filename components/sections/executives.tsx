"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SignedImage } from "@/components/ui/signed-image"
import { User } from "lucide-react"

interface Executive {
    id: string
    name: string
    role: string
    image: string | null
}

export default function ExecutivesSection() {
    const [executives, setExecutives] = useState<Executive[]>([])

    useEffect(() => {
        fetchExecutives()
    }, [])

    const fetchExecutives = async () => {
        try {
            const response = await fetch('/api/executives')
            if (response.ok) {
                const data = await response.json()
                setExecutives(data)
            }
        } catch (error) {
        }
    }

    return (
        <section className="py-16 px-4 md:px-8 lg:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                        Leadership
                    </span>
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                        Commission Executives
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Meet the dedicated team leading the Edo State Local Government Service Commission.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
                    {executives.map((exec, index) => (
                        <motion.div
                            key={exec.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group text-center"
                        >
                            <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden border-4 border-primary/10 group-hover:border-primary/30 transition-colors">
                                {exec.image ? (
                                    <SignedImage
                                        src={exec.image}
                                        alt={exec.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <User className="w-16 h-16 text-muted-foreground/50" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                {exec.name}
                            </h3>
                            <p className="text-sm font-medium text-primary/80 uppercase tracking-wide">
                                {exec.role}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
