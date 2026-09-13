"use client"

import { Card } from "@/components/ui/card"
import { LGAs } from "@/lib/dummy-data"
import type { LGA } from "@/lib/types"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

interface StaffLGASelectorProps {
  selectedLGA: LGA | null
  onSelect: (lga: LGA) => void
}

export default function StaffLGASelector({ selectedLGA, onSelect }: StaffLGASelectorProps) {
  return (
    <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm sticky top-24">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
        <MapPin className="w-4 h-4" />
        Select LGA
      </h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {LGAs.map((lga, index) => (
          <motion.button
            key={lga.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onSelect(lga)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${selectedLGA?.id === lga.id
                ? "bg-linear-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
                : "hover:bg-secondary/20 text-foreground"
              }`}
          >
            <p className="font-medium text-sm">{lga.name}</p>
            <p className="text-xs opacity-75">{lga.zone}</p>
          </motion.button>
        ))}
      </div>
    </Card>
  )
}
