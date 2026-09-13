"use client"

import { useState } from "react"
import { motion } from "framer-motion"

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

interface InteractiveSVGMapProps {
  lgaData: LGA[]
  onLGASelect: (lga: LGA) => void
  selectedLGAId?: string
}

// Define zones for LGAs based on Edo State map
const LGA_ZONES: Record<string, { zone: string; color: string; lgaIds: string[] }> = {
  north: {
    zone: "Northern Zone",
    color: "#10B981", // Emerald
    lgaIds: ["akoko-edo", "etsako-east", "etsako-central", "etsako-west", "owan-east", "owan-west"],
  },
  central: {
    zone: "Central Zone",
    color: "#3B82F6", // Blue
    lgaIds: ["esan-central", "esan-north-east", "esan-south-east", "esan-west", "igueben"],
  },
  south: {
    zone: "Southern Zone",
    color: "#F59E0B", // Amber
    lgaIds: ["egor", "ikpoba-okha", "oredo", "orhionmwon", "ovia-north-east", "ovia-south-west", "uhunmwonde"],
  },
}

export default function InteractiveSVGMap({ lgaData, onLGASelect, selectedLGAId }: InteractiveSVGMapProps) {
  const [hoveredLGAId, setHoveredLGAId] = useState<string | null>(null)

  const renderLGARegion = (lga: LGA) => {
    let zoneInfo = null
    for (const zone of Object.values(LGA_ZONES)) {
      if (zone.lgaIds.includes(lga.id)) {
        zoneInfo = zone
        break
      }
    }

    const isHovered = hoveredLGAId === lga.id
    const isSelected = selectedLGAId === lga.id
    const baseRadius = 25
    const hoverRadius = 35

    return (
      <motion.g
        key={lga.id}
        onClick={() => onLGASelect(lga)}
        className="cursor-pointer"
        onMouseEnter={() => setHoveredLGAId(lga.id)}
        onMouseLeave={() => setHoveredLGAId(null)}
      >
        {/* Animated background circle */}
        <motion.circle
          cx={lga.mapX}
          cy={lga.mapY}
          r={isSelected ? hoverRadius + 5 : isHovered ? hoverRadius : baseRadius}
          fill={zoneInfo?.color || "#D4A574"}
          opacity={isSelected ? 0.3 : isHovered ? 0.2 : 0.1}
          animate={{
            r: isSelected ? hoverRadius + 5 : isHovered ? hoverRadius : baseRadius,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Main interactive circle */}
        <motion.circle
          cx={lga.mapX}
          cy={lga.mapY}
          r={isSelected ? hoverRadius : isHovered ? hoverRadius - 5 : baseRadius - 5}
          fill={zoneInfo?.color || "#D4A574"}
          stroke="white"
          strokeWidth={isSelected || isHovered ? 2 : 1}
          opacity={isSelected ? 1 : isHovered ? 0.9 : 0.8}
          animate={{
            r: isSelected ? hoverRadius : isHovered ? hoverRadius - 5 : baseRadius - 5,
            opacity: isSelected ? 1 : isHovered ? 0.9 : 0.8,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* LGA name label */}
        <motion.text
          x={lga.mapX}
          y={lga.mapY + (isHovered || isSelected ? 45 : 35)}
          textAnchor="middle"
          fill={isSelected ? zoneInfo?.color : "currentColor"}
          className={`text-[10px] font-bold pointer-events-none transition-colors ${isSelected ? "fill-primary" : "fill-foreground/70"
            }`}
          animate={{
            scale: isHovered || isSelected ? 1.2 : 1,
            opacity: isHovered || isSelected ? 1 : 0.7,
          }}
        >
          {lga.name}
        </motion.text>
      </motion.g>
    )
  }

  return (
    <div className="w-full h-full">
      <div className="bg-card rounded-3xl border border-border shadow-2xl overflow-hidden relative h-full flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-border bg-muted/20 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Explore LGAs</h3>
            <p className="text-sm text-muted-foreground mt-1">Interactive visualization of local government areas</p>
          </div>
          <div className="flex gap-3">
            {Object.entries(LGA_ZONES).map(([key, zone]) => (
              <div key={key} className="flex items-center gap-2 px-3  rounded-full bg-background border border-border shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{zone.zone.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className="relative flex-1 bg-linear-to-br from-background to-card/50 p-8">
        
          {/* Main SVG Map */}
          <div className="w-full h-full min-h-[500px] relative rounded-2xl border border-border/50 bg-background/40 backdrop-blur-sm overflow-hidden shadow-inner">
          
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/20" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Grid */}
              <rect width="800" height="500" fill="url(#grid)" />

              {/* Boundary Rectangle */}
              <rect
                x="5" y="5" width="790" height="590"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-border/40"
                rx="15"
              />

              {/* Render all LGA regions */}
              <g className="lgas-layer">
                {lgaData.map((lga) => renderLGARegion(lga))}
              </g>

              {/* Legend/Hint */}
              <g transform="translate(30, 450)">
                <rect width="200" height="30" rx="15" fill="white" fillOpacity="0.9" className="shadow-sm" />
                <text x="15" y="20" className="text-[10px] fill-muted-foreground font-bold italic tracking-wide">
                  Click on a circle to view LGA details
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
