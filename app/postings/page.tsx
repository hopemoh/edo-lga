"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { MapPin, FileText, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHighlights } from "@/hooks/use-resources"

interface Highlight {
    id: string
    title: string
    subtitle: string
    description: string
}

export default function PostingsPage() {
    const router = useRouter()
    const { data: highlights = [], isLoading: loading } = useHighlights("POSTING")

    return (
        <main className="min-h-screen bg-muted/30">
            {/* Header */}
            <div className="bg-linear-to-r from-accent to-primary text-white py-12 px-4 md:px-8 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/20 mb-6"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Staff Postings</h1>
                    <p className="text-white/80 text-lg">
                        Staff transfers and deployments across all LGAs
                    </p>
                    <p className="text-white/60 text-sm mt-4">
                        Total postings: <span className="font-bold">{highlights.length}</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="py-12 px-4 md:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading postings...</p>
                        </div>
                    ) : highlights.length === 0 ? (
                        <div className="text-center py-12 bg-card border border-border rounded-xl border-dashed">
                            <p className="text-muted-foreground">No postings to display.</p>
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
                                        <div className="w-14 h-14 bg-linear-to-br from-accent to-primary rounded-full flex items-center justify-center shrink-0">
                                            <MapPin className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-foreground">{staff.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                <span className="inline-block bg-muted px-3 py-1 rounded-lg text-muted-foreground font-medium text-sm">
                                                    {staff.subtitle.includes('→') ? staff.subtitle.split('→')[0].trim() : staff.subtitle}
                                                </span>
                                                {staff.subtitle.includes('→') && (
                                                    <>
                                                        <ArrowRight className="w-4 h-4 text-accent" />
                                                        <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-lg font-bold text-sm">
                                                            {staff.subtitle.split('→')[1].trim()}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {staff.description && (
                                                <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2">
                                                    <FileText className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
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
