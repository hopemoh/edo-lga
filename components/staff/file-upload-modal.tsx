"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import type { Staff } from "@/lib/types"

interface FileUploadModalProps {
  open: boolean
  onClose: () => void
  onImport: (staff: Staff[]) => void
  lgaId: string
}

export default function FileUploadModal({ open, onClose, onImport, lgaId }: FileUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [uploadStage, setUploadStage] = useState<"parsing" | "uploading" | "complete">("parsing")

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFile = async (file: File) => {
    setError(null)
    setLoading(true)
    setProgress(0)
    setUploadStage("parsing")
    setProgressMessage("Parsing file...")

    try {
      // validate file format
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".pdf")) {
        throw new Error("Unsupported file format. Please upload Excel (.xlsx) or PDF files.")
      }

      setProgress(10)
      setProgressMessage(`File selected: ${file.name}`)
      setUploadStage("uploading")

      // Send to backend
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('lgaId', lgaId)

      const response = await fetch('/api/staff/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const result = await response.json()
        // Check if there are missing references
        if (result.missingReferences) {
          const missing = []
          if (result.missingReferences.missingStatuses?.length > 0) {
            missing.push(`Statuses: ${result.missingReferences.missingStatuses.join(', ')}`)
          }
          if (result.missingReferences.missingRanks?.length > 0) {
            missing.push(`Ranks: ${result.missingReferences.missingRanks.join(', ')}`)
          }
          if (result.missingReferences.missingQualifications?.length > 0) {
            missing.push(`Qualifications: ${result.missingReferences.missingQualifications.join(', ')}`)
          }
          const errorMessage = result.error || 'Missing required references. Please create them before uploading.'
          throw new Error(`${errorMessage}\n\nPlease create the following in the system:\n${missing.join('\n')}`)
        }
        throw new Error(result.error || result.details || "Couldn't save your changes. Please try again.")
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let resultBuffer = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          resultBuffer += decoder.decode(value, { stream: true })
          const lines = resultBuffer.split('\n')
          resultBuffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)

              if (data.stage === "caching") {
                setProgress(20)
                setProgressMessage(data.message)
              } else if (data.stage === "checking_duplicates") {
                setProgress(30)
                setProgressMessage(data.message)
              } else if (data.stage === "processing") {
                const percent = 30 + (data.current / data.total) * 60
                setProgress(percent)
                if (data.status === "creating") {
                  const lgaName = data.lga?.name || data.lga || "assigned LGA"
                  setProgressMessage(`Creating ${data.name} in ${lgaName}... (${data.current}/${data.total})`)
                } else if (data.status === "skipped") {
                  setProgressMessage(`Skipping ${data.name} (exists)...`)
                } else if (data.status === "failed") {
                  setProgressMessage(`Failed to create ${data.name}`)
                }
              } else if (data.stage === "complete") {
                setProgress(100)
                setProgressMessage(`Successfully created ${data.created} staff records. ${data.errors} errors occurred.`)
                setUploadStage("complete")
              } else if (data.success === false) {
                throw new Error(data.error || "Upload failed")
              }
            } catch (e: any) {
              if (e.message && e.message !== "Unexpected end of JSON input") {
                throw e
              }
            }
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
      onImport([])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load your file. Please try again.")
      setLoading(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || [])
    const file = files[0]
    if (file) {
      handleFile(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Staff Members</DialogTitle>
          <DialogDescription>Upload an Excel file to bulk create staff data</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
              }`}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.pdf"
              onChange={handleFileInput}
              disabled={loading}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-primary/60" />
                <div>
                  <p className="font-medium text-sm">Drag and drop your file here</p>
                  <p className="text-xs text-muted-foreground">or click to select</p>
                </div>
                <p className="text-xs text-muted-foreground">Supported: Excel (.xlsx)</p>
              </div>
            </label>
          </motion.div>

          {/* Progress */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">{progressMessage}</p>
                  <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-linear-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              {uploadStage === "uploading" && (
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                  Uploading staff data to database...
                </p>
              )}
              {uploadStage === "complete" && (
                <p className="text-sm text-green-600 text-center font-medium">
                  Upload complete! Refreshing data...
                </p>
              )}
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-destructive/10 rounded-md flex gap-2"
            >
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-destructive">Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <Card className="p-4 bg-secondary/30 border-border/50">
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                File Format Requirements
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Excel files should have columns: Name, Sex, Status, Rank, Phone, etc.</li>
                {/*<li>PDF files should contain structured staff data</li>*/}
                <li>Maximum 500 records per file</li>
              </ul>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => document.getElementById("file-input")?.click()}
              className="flex-1 bg-linear-to-r from-primary to-accent"
            >
              Select File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
