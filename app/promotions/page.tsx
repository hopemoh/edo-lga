"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { TrendingUp, Award, ArrowUpRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Highlight {
    id: string
    title: string
    subtitle: string
    description: string
}

export default function PromotionsPage() {
    const [highlights, setHighlights] = useState<Highlight[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchHighlights()
    }, [])

    const fetchHighlights = async () => {
        try {
            const response = await fetch('/api/highlights?type=PROMOTION')
            if (response.ok) {
                const data = await response.json()
                setHighlights(data)
            }
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-muted/30">
            {/* Header */}
            <div className="bg-linear-to-r from-primary to-accent text-white py-12 px-4 md:px-8 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/20 mb-6"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Staff Promotions</h1>
                    <p className="text-white/80 text-lg">
                        Celebrating excellence and dedication in the Local Government Service
                    </p>
                    <p className="text-white/60 text-sm mt-4">
                        Total promotions: <span className="font-bold">{highlights.length}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="py-12 px-4 md:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading promotions...</p>
                        </div>
                    ) : highlights.length === 0 ? (
                        <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                            <p className="text-muted-foreground">No promotions to display.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {highlights.map((staff, index) => (
                                <motion.div
                                    key={staff.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center shrink-0">
                                            <TrendingUp className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-foreground">{staff.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                <span className="inline-block bg-muted px-3 py-1 rounded-lg text-muted-foreground font-medium text-sm">
                                                    {staff.subtitle.split('→')[0].trim()}
                                                </span>
                                                <ArrowUpRight className="w-4 h-4 text-green-500" />
                                                <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-lg font-bold text-sm">
                                                    {staff.subtitle.split('→')[1]?.trim() || 'Promoted'}
                                                </span>
                                            </div>
                                            {staff.description && (
                                                <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2">
                                                    <Award className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                                                    <span>{staff.description}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
