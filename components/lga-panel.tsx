"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { SignedImage } from "@/components/ui/signed-image"
import { X } from "lucide-react"

interface LGA {
  id: string
  name: string
  description: string
  landmarks: string[]
  activities: string[]
  image: string
}

interface LGAPanelProps {
  lga: LGA
  onClose: () => void
}

export default function LGAPanel({ lga, onClose }: LGAPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.4 }}
        className="w-full lg:w-1/3 h-fit sticky top-20"
      >
        <div className="bg-card rounded-2xl border-2 border-border p-6 md:p-8 shadow-lg">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden text-foreground hover:text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-48 rounded-xl mb-6 overflow-hidden bg-linear-to-br from-secondary to-primary"
          >
            <SignedImage src={lga.image || "/placeholder.svg"} alt={lga.name} className="w-full h-full object-cover" />
          </motion.div>

          {/* LGA Name */}
          <motion.h2
            key={`name-${lga.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-foreground mb-2"
          >
            {lga.name}
          </motion.h2>

          {/* Description */}
          <motion.p
            key={`desc-${lga.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mb-6 leading-relaxed"
          >
            {lga.description}
          </motion.p>

          {/* Landmarks */}
          <motion.div
            key={`landmarks-${lga.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">Key Landmarks</h3>
            <ul className="space-y-2">
              {lga.landmarks.map((landmark, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">{landmark}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Activities */}
          <motion.div
            key={`activities-${lga.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">Economic Activities</h3>
            <div className="flex flex-wrap gap-2">
              {lga.activities.map((activity, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {activity}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Close button desktop */}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full hidden lg:block mt-8 border-border hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            View Another LGA
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
