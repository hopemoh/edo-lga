"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/ui/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"

interface ContentFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ContentData {
  section: string
  title: string
  subtitle: string
  content: string
}

const sectionGroups = [
  {
    name: "Main",
    sections: [
      { id: 'hero', label: 'Hero' },
      { id: 'about', label: 'About' },
      { id: 'mission', label: 'Mission' },
      { id: 'vision', label: 'Vision' }
    ]
  },
  {
    name: "HR Functions",
    sections: [
      { id: 'appointments', label: 'Appointments' },
      { id: 'posting', label: 'Posting' },
      { id: 'promotions', label: 'Promotions' },
      { id: 'conversion', label: 'Conversion' }
    ]
  },
  {
    name: "Development",
    sections: [
      { id: 'training', label: 'Training' },
      { id: 'recruitment', label: 'Recruitment' }
    ]
  },
  {
    name: "Governance",
    sections: [
      { id: 'discipline', label: 'Discipline' },
      { id: 'monitoring', label: 'Monitoring' },
      { id: 'petitions', label: 'Petitions' }
    ]
  },
  {
    name: "Reports",
    sections: [
      { id: 'annual-report', label: 'Annual Report' },
      { id: 'junior-staff', label: 'Junior Staff' }
    ]
  }
]

const defaultContent: Record<string, ContentData> = {
  hero: {
    section: 'hero',
    title: 'Explore Edo State',
    subtitle: 'The Heartbeat of Nigeria',
    content: "Immerse yourself in the rich cultural heritage, vibrant communities, and economic vitality of Edo State's 18 Local Government Areas"
  },
  about: {
    section: 'about',
    title: 'The Heartbeat of Nigeria',
    subtitle: 'Our Heritage',
    content: "Edo State stands as a beacon of African heritage and cultural pride. Home to the historic Kingdom of Benin, the state is renowned for its magnificent Oba's Palace, intricate bronze works, and rich artistic traditions."
  },
  appointments: {
    section: 'appointments',
    title: 'HOD Appointments',
    subtitle: 'Leadership Excellence',
    content: 'The appointment of Heads of Departments (HODs) is a crucial responsibility of the Local Government Service Commission.'
  },
  posting: {
    section: 'posting',
    title: 'Personnel Movement',
    subtitle: 'Staff Posting & Transfers',
    content: 'The Commission manages staff postings and transfers across all Local Government Areas.'
  },
  promotions: {
    section: 'promotions',
    title: 'Staff Promotions',
    subtitle: 'Career Advancement',
    content: 'The Commission ensures fair and transparent promotion processes for all eligible staff members.'
  },
  conversion: {
    section: 'conversion',
    title: 'Cadre Conversion',
    subtitle: 'Career Transition & Upgrade',
    content: 'Staff cadre conversion and upgrade programs enable employees to transition between career paths.'
  },
  training: {
    section: 'training',
    title: 'Staff Training',
    subtitle: 'Capacity Building',
    content: 'Continuous professional development is key to effective service delivery.'
  },
  discipline: {
    section: 'discipline',
    title: 'Staff Discipline',
    subtitle: 'Ethics & Compliance',
    content: 'The Commission handles disciplinary matters with fairness and in accordance with civil service rules.'
  },
  recruitment: {
    section: 'recruitment',
    title: 'Staff Recruitment',
    subtitle: 'Building the Workforce',
    content: 'The Commission oversees the recruitment of qualified personnel into the Local Government Service.'
  },
  monitoring: {
    section: 'monitoring',
    title: 'Monitoring Team',
    subtitle: 'Oversight & Evaluation',
    content: 'The Monitoring Team ensures compliance with civil service rules and regulations across all LGAs.'
  },
  petitions: {
    section: 'petitions',
    title: 'Staff Petitions',
    subtitle: 'Grievance Resolution',
    content: 'The Commission provides a fair and transparent mechanism for staff to submit petitions and grievances.'
  },
  'annual-report': {
    section: 'annual-report',
    title: 'Annual Reports',
    subtitle: 'Transparency & Accountability',
    content: 'The Commission publishes comprehensive annual reports detailing activities, achievements, and statistical data.'
  },
  'junior-staff': {
    section: 'junior-staff',
    title: 'Junior Staff Committee',
    subtitle: 'Welfare & Representation',
    content: 'The Junior Staff Management Committee represents the interests of junior staff members across all Local Government Areas.'
  },
  mission: {
    section: 'mission',
    title: 'Our Mission',
    subtitle: 'Service Excellence',
    content: 'To provide a highly motivated, professional and efficient workforce for the Local Government Service through effective recruitment, training, and management, ensuring excellence in service delivery at the grassroots level.'
  },
  vision: {
    section: 'vision',
    title: 'Our Vision',
    subtitle: 'Future Outlook',
    content: 'To be a world-class Local Government Service Commission that ensures transparency, accountability, and sustainable development across all 18 Local Government Areas of Edo State.'
  }
}

export default function ContentFormModal({ open, onClose, onSuccess }: ContentFormModalProps) {
  const [contentData, setContentData] = useState<Record<string, ContentData>>(defaultContent)
  const [activeSection, setActiveSection] = useState('hero')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (open) {
      fetchContent()
    }
  }, [open])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/content')
      if (response.ok) {
        const content = await response.json()
        const newContentData = { ...defaultContent }
        content.forEach((item: ContentData) => {
          if (newContentData[item.section]) {
            newContentData[item.section] = item
          }
        })
        setContentData(newContentData)
      }
    } catch (error) {
    }
  }

  const handleInputChange = (section: string, field: keyof ContentData, value: string) => {
    setContentData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (section: string) => {
    setLoading(true)
    setError("")
    setSuccessMessage("")

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contentData[section])
      })

      if (response.ok) {
        setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} section updated successfully!`)
        setTimeout(() => setSuccessMessage(""), 3000)
        onSuccess()
      } else {
        const result = await response.json()
        setError(result.error || "Couldn't save your changes. Please try again.")
      }
    } catch (err) {
      setError("You appear to be offline. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const renderSectionForm = (section: { id: string; label: string }) => {
    const data = contentData[section.id]
    if (!data) return null

    return (
      <motion.form
        key={section.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(section.id)
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor={`${section.id}-title`}>Title</Label>
          <Input
            id={`${section.id}-title`}
            value={data.title}
            onChange={(e) => handleInputChange(section.id, 'title', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
          <Input
            id={`${section.id}-subtitle`}
            value={data.subtitle}
            onChange={(e) => handleInputChange(section.id, 'subtitle', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${section.id}-content`}>Content</Label>
          <div className="min-h-[200px]">
            <RichTextEditor
              value={data.content}
              onChange={(value) => handleInputChange(section.id, 'content', value)}
              placeholder="Enter content..."
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Updating..." : `Update ${section.label} Section`}
        </Button>
      </motion.form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Landing Page Content</DialogTitle>
        </DialogHeader>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm"
          >
            {successMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-[200px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <div className="space-y-4">
            {sectionGroups.map((group) => (
              <div key={group.name}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {group.name}
                </h4>
                <div className="space-y-1">
                  {group.sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Content Form */}
          <div className="min-h-[400px]">
            {sectionGroups.flatMap(g => g.sections).map((section) => (
              activeSection === section.id && renderSectionForm(section)
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
