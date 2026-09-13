"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { SignedImage } from "@/components/ui/signed-image"
import RichTextDisplay from "@/components/ui/rich-text-display"

interface LGA {
  id: string
  name: string
  description: string
  landmarks: string[]
  activities: string[]
  image: string
  mapX: number
  mapY: number
}

interface LGADetailModalProps {
  lga: LGA
  onClose: () => void
}

export default function LGADetailModal({ lga, onClose }: LGADetailModalProps) {
  const [direction, setDirection] = useState(1)
  const [currentLGA, setCurrentLGA] = useState(lga)
  const [allLGAs, setAllLGAs] = useState<LGA[]>([])

  useEffect(() => {
    fetch("/api/lgas")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.details?.description || "",
          landmarks: item.details?.landmarks || [],
          activities: item.details?.activities || [],
          image: item.details?.image || "",
          mapX: item.details?.mapX || 0,
          mapY: item.details?.mapY || 0,
        }))
        setAllLGAs(formatted)
      })
      .catch(() => {})
  }, [])

  const lgaList = allLGAs.length > 0 ? allLGAs : [lga]
  const currentIndex = lgaList.findIndex((item) => item.id === currentLGA.id)
  const nextIndex = (currentIndex + 1) % lgaList.length
  const prevIndex = (currentIndex - 1 + lgaList.length) % lgaList.length

  const handleNext = () => {
    setDirection(1)
    setCurrentLGA(lgaList[nextIndex])
  }

  const handlePrev = () => {
    setDirection(-1)
    setCurrentLGA(lgaList[prevIndex])
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-card border-2 border-border shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>

          <div className="overflow-y-auto max-h-[90vh]">
            <div className="relative h-96 overflow-hidden">
              <SignedImage
                key={`image-${currentLGA.id}`}
                src={currentLGA.image || "/placeholder.svg?height=400&width=800&query=Edo%20State%20LGA"}
                alt={currentLGA.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-card via-transparent to-transparent" />
            </div>

            <div className="p-8 md:p-12">
              <motion.div
                key={`header-${currentLGA.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance">{currentLGA.name}</h1>
                <div className="w-16 h-1 bg-linear-to-r from-primary to-secondary rounded-full" />
              </motion.div>

              <motion.div
                key={`desc-${currentLGA.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <RichTextDisplay
                  content={currentLGA.description}
                  className="text-lg text-muted-foreground"
                />
              </motion.div>

              <motion.div
                key={`landmarks-${currentLGA.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">Key Landmarks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentLGA.landmarks.map((landmark, i) => (
                    <motion.div
                      key={`landmark-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-foreground">{landmark}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                key={`activities-${currentLGA.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-foreground mb-4">Economic Activities</h2>
                <div className="flex flex-wrap gap-3">
                  {currentLGA.activities.map((activity, i) => (
                    <motion.span
                      key={`activity-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                      {activity}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="sticky bottom-0 flex items-center justify-between gap-4 p-6 bg-linear-to-t from-card to-transparent border-t border-border"
          >
            <button
              onClick={handlePrev}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-secondary text-foreground font-semibold">
                {currentIndex + 1} / {lgaList.length}
              </span>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95 font-medium"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
