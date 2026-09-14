"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Landmark, Activity, ChevronRight, Search } from "lucide-react"
import RichTextDisplay from "@/components/ui/rich-text-display"
import { useLGAs } from "@/hooks/use-lgas"

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

interface EdoMapProps {
  onLGASelect: (lga: LGA) => void
}

export default function EdoMap({ onLGASelect }: EdoMapProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: rawData, isLoading: loading } = useLGAs()

  const lgaData: LGA[] = rawData
    ? rawData.map((lga: any) => ({
        id: lga.id,
        name: lga.name,
        description: lga.details?.description || '',
        landmarks: lga.details?.landmarks || [],
        activities: lga.details?.activities || [],
        image: lga.details?.image || '/placeholder.jpg',
        mapX: lga.details?.mapX || 0,
        mapY: lga.details?.mapY || 0
      }))
    : []

  const handleLGASelect = (lga: LGA) => {
    onLGASelect(lga)
  }

  const zones = {
    "Northern Zone": {
      lgas: lgaData.filter(lga => ["akoko-edo", "etsako-east", "etsako-central", "etsako-west", "owan-east", "owan-west"].includes(lga.id)),
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/30",
      hoverBorder: "hover:border-emerald-500/60",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      badge: "bg-emerald-500"
    },
    "Central Zone": {
      lgas: lgaData.filter(lga => ["esan-central", "esan-north-east", "esan-south-east", "esan-west", "igueben"].includes(lga.id)),
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/30",
      hoverBorder: "hover:border-blue-500/60",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      badge: "bg-blue-500"
    },
    "Southern Zone": {
      lgas: lgaData.filter(lga => ["egor", "ikpoba-okha", "oredo", "orhionmwon", "ovia-north-east", "ovia-south-west", "uhunmwonde"].includes(lga.id)),
      color: "amber",
      gradient: "from-amber-500/20 to-amber-600/5",
      borderColor: "border-amber-500/30",
      hoverBorder: "hover:border-amber-500/60",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      badge: "bg-amber-500"
    }
  }

  const filteredZones = Object.entries(zones).map(([zoneName, zoneData]) => ({
    zoneName,
    ...zoneData,
    lgas: zoneData.lgas.filter(lga =>
      lga.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(zone => zone.lgas.length > 0)

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
          <MapPin className="w-4 h-4" />
          Explore Edo State
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Local Government Areas
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Discover the 18 local governments that make up Edo State. Click on any LGA to learn about its unique heritage, landmarks, and culture.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-md mx-auto mb-12"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search local governments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-card/50 backdrop-blur-sm border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
          />
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* LGA Cards by Zone */}
      {!loading && (
        <div className="space-y-12">
          {filteredZones.map((zone, zoneIndex) => (
            <motion.div
              key={zone.zoneName}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: zoneIndex * 0.1 }}
              viewport={{ once: true }}
            >
              {/* Zone Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-1.5 h-8 rounded-full ${zone.badge}`} />
                <h3 className="text-xl font-bold text-foreground">{zone.zoneName}</h3>
                <span className="text-sm text-muted-foreground">
                  ({zone.lgas.length} LGA{zone.lgas.length !== 1 ? 's' : ''})
                </span>
              </div>

              {/* LGA Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {zone.lgas.map((lga, index) => (
                  <motion.button
                    key={lga.id}
                    onClick={() => handleLGASelect(lga)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className={`group relative text-left p-5 rounded-2xl border bg-gradient-to-br ${zone.gradient} ${zone.borderColor} ${zone.hoverBorder} backdrop-blur-sm hover:shadow-xl hover:shadow-${zone.color}-500/10 transition-all duration-300 cursor-pointer`}
                  >
                    <div className="flex items-start gap-4">
                      {/* LGA Icon */}
                      <div className={`w-12 h-12 rounded-xl ${zone.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <span className={`font-bold text-lg ${zone.iconColor}`}>
                          {lga.name.charAt(0)}
                        </span>
                      </div>

                      {/* LGA Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {lga.name}
                        </h4>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Landmark className="w-3.5 h-3.5" />
                            <span>{lga.landmarks.length} Landmarks</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="w-3.5 h-3.5" />
                            <span>{lga.activities.length} Activities</span>
                          </div>
                        </div>

                        {lga.description && (
                          <div className="mt-2">
                            <RichTextDisplay
                              content={lga.description}
                              className="text-xs text-muted-foreground"
                              truncate={true}
                              maxLines={2}
                            />
                          </div>
                        )}
                      </div>

                      {/* Arrow Icon */}
                      <div className={`${zone.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`}>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Subtle glow effect on hover */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${zone.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10 blur-xl`} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}

          {/* No Results */}
          {filteredZones.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No LGAs found</h3>
              <p className="text-muted-foreground">
                Try searching with a different term
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
