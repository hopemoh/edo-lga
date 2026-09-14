"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useBulkUpdate } from "@/hooks/use-staff"

interface BulkUpdateModalProps {
  open: boolean
  onClose: () => void
  lgaId: string
}

export default function BulkUpdateModal({ open, onClose, lgaId }: BulkUpdateModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [results, setResults] = useState<{ updated: number; notFound: number; failed: number; total: number } | null>(null)
  const bulkUpdate = useBulkUpdate()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleFile = async (file: File) => {
    setError(null)
    setLoading(true)
    setProgress(0)
    setResults(null)
    setProgressMessage("Preparing file...")

    try {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        throw new Error("Only Excel files (.xlsx, .xls) are supported for bulk update.")
      }

      setProgress(10)
      setProgressMessage(`Processing: ${file.name}`)

      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("lgaId", lgaId)

      const response = await fetch("/api/staff/bulk", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Update failed")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)

              if (data.type === "total") {
                setProgress(20)
                setProgressMessage(data.message)
              } else if (data.type === "progress") {
                const pct = 20 + (data.current / data.total) * 70
                setProgress(pct)
                if (data.status === "success") {
                  setProgressMessage(`Updated ${data.name} (${data.current}/${data.total})`)
                } else if (data.status === "not_found") {
                  setProgressMessage(`${data.name} not found in this LGA (${data.current}/${data.total})`)
                } else if (data.status === "error") {
                  setProgressMessage(`Failed to update ${data.name}: ${data.error}`)
                }
              } else if (data.type === "complete") {
                setProgress(100)
                setProgressMessage(data.message)
                setResults({
                  updated: data.updated,
                  notFound: data.notFound,
                  failed: data.failed,
                  total: data.total,
                })
              } else if (data.type === "error") {
                throw new Error(data.message)
              }
            } catch (e: any) {
              if (e.message && e.message !== "Unexpected end of JSON input") {
                throw e
              }
            }
          }
        }
      }

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed. Please try again.")
      setLoading(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) handleFile(file)
  }

  const handleClose = () => {
    if (!loading) {
      setResults(null)
      setProgress(0)
      setProgressMessage("")
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Update Staff</DialogTitle>
          <DialogDescription>
            Upload an Excel file to update existing staff records by name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!results ? (
            <>
              <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  disabled={loading}
                  className="hidden"
                  id="bulk-update-input"
                />
                <label htmlFor="bulk-update-input" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="w-8 h-8 text-primary/60" />
                    <div>
                      <p className="font-medium text-sm">Drag and drop your update file here</p>
                      <p className="text-xs text-muted-foreground">or click to select</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Supported: Excel (.xlsx)</p>
                  </div>
                </label>
              </motion.div>

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
                </motion.div>
              )}

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

              <Card className="p-4 bg-secondary/30 border-border/50">
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    How Bulk Update Works
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Staff are matched by <strong>Name</strong> (case-insensitive) within the selected LGA</li>
                    <li>Include a &quot;Name&quot; column (required) plus any fields to update</li>
                    <li>Supported columns: Name, Sex, Status, Rank, SGL, Phone Number, Remark, Qualification</li>
                    <li>Leave a cell empty to keep the existing value</li>
                  </ul>
                </div>
              </Card>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{results.updated}</p>
                  <p className="text-xs text-green-600">Updated</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Search className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-amber-700">{results.notFound}</p>
                  <p className="text-xs text-amber-600">Not Found</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {results.total} records processed
              </p>
            </motion.div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-transparent"
            >
              {results ? "Close" : "Cancel"}
            </Button>
            {!results && (
              <Button
                onClick={() => document.getElementById("bulk-update-input")?.click()}
                className="flex-1 bg-linear-to-r from-primary to-accent"
                disabled={loading}
              >
                Select File
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
