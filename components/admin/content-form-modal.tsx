"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/ui/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useContent, useUpsertContent } from "@/hooks/use-resources"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contentSectionSchema } from "@/lib/validations"
import { toast } from "sonner"
import { Upload, FileText, X } from "lucide-react"
import type { z } from "zod"

type ContentFormValues = z.infer<typeof contentSectionSchema>

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
  reportFileUrl?: string
  culturalTitle?: string
  culturalContent?: string
  economicTitle?: string
  economicContent?: string
  stats?: { number: string; label: string }[]
  footerLinks?: { label: string; href: string }[]
  footerDescription?: string
  footerCopyright?: string
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
      { id: 'junior-staff', label: 'Junior Staff' },
      { id: 'footer', label: 'Footer' }
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
    content: "Edo State stands as a beacon of African heritage and cultural pride. Home to the historic Kingdom of Benin, the state is renowned for its magnificent Oba's Palace, intricate bronze works, and rich artistic traditions.",
    culturalTitle: 'Cultural Richness',
    culturalContent: "Edo State stands as a beacon of African heritage and cultural pride. Home to the historic Kingdom of Benin, the state is renowned for its magnificent Oba's Palace, intricate bronze works, and rich artistic traditions.",
    economicTitle: 'Economic Vitality',
    economicContent: 'Beyond its cultural significance, Edo State is a thriving economic hub. From agriculture and commerce to arts and crafts, the 18 Local Government Areas work together to drive sustainable development and improve the quality of life for millions of residents.',
    stats: [
      { number: "18", label: "Local Government Areas" },
      { number: "4.3M", label: "Population" },
      { number: "17K", label: "Square Kilometers" },
      { number: "60+", label: "Years of Heritage" },
    ]
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
  },
  footer: {
    section: 'footer',
    title: 'Footer',
    subtitle: '',
    content: '',
    footerDescription: 'Edo State Local Government Service Commission — Dedicated to transparent, efficient, and accountable public service across all 18 LGAs.',
    footerCopyright: `© ${new Date().getFullYear()} Edo State Local Government Service Commission. All rights reserved.`,
    footerLinks: [
      { label: 'Home', href: '/' },
      { label: 'Help', href: '/help' },
      { label: 'Login', href: '/login' },
    ]
  }
}

export default function ContentFormModal({ open, onClose, onSuccess }: ContentFormModalProps) {
  const [contentData, setContentData] = useState<Record<string, ContentData>>(defaultContent)
  const [activeSection, setActiveSection] = useState('hero')
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [uploadingReport, setUploadingReport] = useState(false)
  const [reportFileUrl, setReportFileUrl] = useState<string | null>(null)
  const [economicTitle, setEconomicTitle] = useState("")
  const [economicContent, setEconomicContent] = useState("")
  const [culturalTitle, setCulturalTitle] = useState("")
  const [culturalContent, setCulturalContent] = useState("")
  const [stats, setStats] = useState<{ number: string; label: string }[]>([
    { number: "", label: "" },
    { number: "", label: "" },
    { number: "", label: "" },
    { number: "", label: "" },
  ])
  const [footerLinks, setFooterLinks] = useState<{ label: string; href: string }[]>([])
  const [footerDescription, setFooterDescription] = useState("")
  const [footerCopyright, setFooterCopyright] = useState("")

  const { data: content = [] } = useContent()
  const upsertContent = useUpsertContent()

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSectionSchema),
    defaultValues: {
      section: 'hero',
      title: defaultContent.hero.title,
      subtitle: defaultContent.hero.subtitle,
      content: defaultContent.hero.content,
    },
  })

  useEffect(() => {
    if (content && content.length > 0) {
      const newContentData = { ...defaultContent }
      content.forEach((item: any) => {
        if (newContentData[item.section]) {
          const meta = item.metadata || {}
          newContentData[item.section] = {
            ...newContentData[item.section],
            ...item,
            reportFileUrl: meta.reportFileUrl || newContentData[item.section].reportFileUrl,
            culturalTitle: meta.culturalTitle || newContentData[item.section].culturalTitle,
            culturalContent: meta.culturalContent || newContentData[item.section].culturalContent,
            economicTitle: meta.economicTitle || newContentData[item.section].economicTitle,
            economicContent: meta.economicContent || newContentData[item.section].economicContent,
            stats: meta.stats || newContentData[item.section].stats,
            footerLinks: meta.footerLinks || newContentData[item.section].footerLinks,
            footerDescription: meta.footerDescription || newContentData[item.section].footerDescription,
            footerCopyright: meta.footerCopyright || newContentData[item.section].footerCopyright,
          }
        }
      })
      setContentData(newContentData)
    }
  }, [content])

  useEffect(() => {
    const data = contentData[activeSection]
    if (data) {
      reset({
        section: data.section,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
      })
      setReportFileUrl(data.reportFileUrl || null)
      setEconomicTitle(data.economicTitle || "")
      setEconomicContent(data.economicContent || "")
      setCulturalTitle(data.culturalTitle || "")
      setCulturalContent(data.culturalContent || "")
      setStats(data.stats && data.stats.length === 4 ? data.stats : [
        { number: "", label: "" },
        { number: "", label: "" },
        { number: "", label: "" },
        { number: "", label: "" },
      ])
      setFooterLinks(data.footerLinks || [])
      setFooterDescription(data.footerDescription || "")
      setFooterCopyright(data.footerCopyright || "")
    }
  }, [activeSection, contentData, reset])

  const handleFormSubmit = (data: ContentFormValues) => {
    setError("")
    setSuccessMessage("")

    const metadata: Record<string, any> = {}
    if (data.section === 'annual-report' && reportFileUrl) {
      metadata.reportFileUrl = reportFileUrl
    }
    if (data.section === 'about') {
      metadata.culturalTitle = culturalTitle
      metadata.culturalContent = culturalContent
      metadata.economicTitle = economicTitle
      metadata.economicContent = economicContent
      metadata.stats = stats.filter(s => s.number && s.label)
    }
    if (data.section === 'footer') {
      metadata.footerLinks = footerLinks
      metadata.footerDescription = footerDescription
      metadata.footerCopyright = footerCopyright
    }

    const sectionData: ContentData = {
      section: data.section,
      title: data.title,
      subtitle: data.subtitle || "",
      content: data.content || "",
      ...(data.section === 'annual-report' && reportFileUrl ? { reportFileUrl } : {}),
      ...(data.section === 'about' ? {
        culturalTitle,
        culturalContent,
        economicTitle,
        economicContent,
        stats: stats.filter(s => s.number && s.label),
      } : {}),
    }

    setContentData(prev => ({
      ...prev,
      [data.section]: sectionData,
    }))

    upsertContent.mutate({ ...sectionData, metadata } as any, {
      onSuccess: () => {
        setSuccessMessage(`${data.section.charAt(0).toUpperCase() + data.section.slice(1)} section updated successfully!`)
        setTimeout(() => setSuccessMessage(""), 3000)
        onSuccess()
      },
      onError: (err: any) => {
        setError(err.message || "Couldn't save your changes. Please try again.")
      }
    })
  }

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    setUploadingReport(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const token = localStorage.getItem("token")
      const res = await fetch("/api/content/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setReportFileUrl(data.url)
        toast.success("Report uploaded successfully")
      } else {
        toast.error(data.error || "Couldn't upload report. Please try again.")
      }
    } catch {
      toast.error("Couldn't upload report. Please try again.")
    } finally {
      setUploadingReport(false)
    }
  }

  const renderSectionForm = (section: { id: string; label: string }) => {
    if (activeSection !== section.id) return null

    return (
      <motion.form
        key={section.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        <input type="hidden" {...register("section")} value={section.id} />

        <div className="space-y-2">
          <Label htmlFor={`${section.id}-title`}>Title</Label>
          <Input
            id={`${section.id}-title`}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
          <Input
            id={`${section.id}-subtitle`}
            {...register("subtitle")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${section.id}-content`}>Content</Label>
          <div className="min-h-[200px]">
            <RichTextEditor
              value={watch("content") || ""}
              onChange={(value) => setValue("content", value)}
              placeholder="Enter content..."
            />
          </div>
        </div>

        {section.id === 'annual-report' && (
          <div className="space-y-2">
            <Label>Annual Report PDF</Label>
            {reportFileUrl ? (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Annual Report uploaded</p>
                  <a
                    href={reportFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View current file
                  </a>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportFileUrl(null)}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg cursor-pointer hover:bg-muted/80 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  {uploadingReport ? "Uploading..." : "Upload PDF"}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleReportUpload}
                    disabled={uploadingReport}
                  />
                </label>
                <p className="text-xs text-muted-foreground">PDF only, max 10MB</p>
              </div>
            )}
          </div>
        )}

        {section.id === 'about' && (
          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cultural Richness</h4>
            <div className="space-y-2">
              <Label>Cultural Section Title</Label>
              <Input
                value={culturalTitle}
                onChange={(e) => setCulturalTitle(e.target.value)}
                placeholder="Cultural Richness"
              />
            </div>
            <div className="space-y-2">
              <Label>Cultural Section Content</Label>
              <div className="min-h-[150px]">
                <RichTextEditor
                  value={culturalContent}
                  onChange={setCulturalContent}
                  placeholder="Enter cultural section content..."
                />
              </div>
            </div>

            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Economic Vitality</h4>
            <div className="space-y-2">
              <Label>Economic Section Title</Label>
              <Input
                value={economicTitle}
                onChange={(e) => setEconomicTitle(e.target.value)}
                placeholder="Economic Vitality"
              />
            </div>
            <div className="space-y-2">
              <Label>Economic Section Content</Label>
              <div className="min-h-[150px]">
                <RichTextEditor
                  value={economicContent}
                  onChange={setEconomicContent}
                  placeholder="Enter economic section content..."
                />
              </div>
            </div>

            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={stat.number}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[i] = { ...newStats[i], number: e.target.value }
                      setStats(newStats)
                    }}
                    placeholder="Number"
                    className="w-24"
                  />
                  <Input
                    value={stat.label}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[i] = { ...newStats[i], label: e.target.value }
                      setStats(newStats)
                    }}
                    placeholder="Label"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {section.id === 'footer' && (
          <div className="space-y-4 border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Footer Settings</h4>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="Footer description text..."
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm resize-none h-20"
              />
            </div>
            <div className="space-y-2">
              <Label>Copyright Text</Label>
              <Input
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
                placeholder="© 2026 Edo State..."
              />
            </div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Navigation Links</h4>
            {footerLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={link.label}
                  onChange={(e) => {
                    const newLinks = [...footerLinks]
                    newLinks[i] = { ...newLinks[i], label: e.target.value }
                    setFooterLinks(newLinks)
                  }}
                  placeholder="Label"
                  className="w-1/3"
                />
                <Input
                  value={link.href}
                  onChange={(e) => {
                    const newLinks = [...footerLinks]
                    newLinks[i] = { ...newLinks[i], href: e.target.value }
                    setFooterLinks(newLinks)
                  }}
                  placeholder="/path"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFooterLinks(footerLinks.filter((_, idx) => idx !== i))}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFooterLinks([...footerLinks, { label: "", href: "" }])}
            >
              + Add Link
            </Button>
          </div>
        )}

        <Button type="submit" disabled={upsertContent.isPending} className="w-full">
          {upsertContent.isPending ? "Updating..." : `Update ${section.label} Section`}
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
