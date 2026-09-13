"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SignedImage } from "@/components/ui/signed-image"
import { motion } from "framer-motion"
import RichTextEditor from "@/components/ui/rich-text-editor"

interface LGAFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  lgaId?: string
}

export default function LGAFormModal({ open, onClose, onSuccess, lgaId }: LGAFormModalProps) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    zone: "Northern",
    description: "",
    landmarks: "",
    activities: "",
    image: null as File | null,
    currentImageUrl: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && lgaId) {
      fetchLGAData()
    } else if (open && !lgaId) {
      // Reset form for new LGA
      setFormData({
        id: "", name: "", zone: "Northern", description: "",
        landmarks: "", activities: "",
        image: null, currentImageUrl: ""
      })
    }
  }, [open, lgaId])

  const fetchLGAData = async () => {
    try {
      const response = await fetch(`/api/lgas/${lgaId}`)
      if (response.ok) {
        const lga = await response.json()
        setFormData({
          id: lga.id,
          name: lga.name,
          zone: lga.zone || "Northern",
          description: lga.details?.description || "",
          landmarks: lga.details?.landmarks?.join(", ") || "",
          activities: lga.details?.activities?.join(", ") || "",
          image: null,
          currentImageUrl: lga.details?.image || ""
        })
      }
    } catch (error) {
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()

      formDataToSend.append('name', formData.name)
      formDataToSend.append('zone', formData.zone)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('landmarks', formData.landmarks)
      formDataToSend.append('activities', formData.activities)

      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const url = lgaId ? `/api/lgas/${lgaId}` : '/api/lgas'
      const method = lgaId ? 'PUT' : 'POST'

      if (!lgaId) {
        formDataToSend.append('id', formData.id.toLowerCase().replace(/\s+/g, '-'))
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        setFormData({
          id: "", name: "", zone: "Northern", description: "",
          landmarks: "", activities: "",
          image: null, currentImageUrl: ""
        })
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Couldn't save your changes. Please try again.")
      }
    } catch (err) {
      setError("You appear to be offline. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto antialiased">
        <DialogHeader>
          <DialogTitle className="antialiased">{lgaId ? 'Update LGA' : 'Add New LGA'}</DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4 antialiased"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!lgaId && (
              <div className="space-y-2">
                <Label htmlFor="name">LGA Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    updateField('name', e.target.value)
                    updateField('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }}
                  required
                />
              </div>
            )}

            {lgaId && (
              <div className="space-y-2">
                <Label htmlFor="name">LGA Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select value={formData.zone} onValueChange={(value) => updateField('zone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Northern">Northern</SelectItem>
                  <SelectItem value="Central">Central</SelectItem>
                  <SelectItem value="Southern">Southern</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="image">LGA Image</Label>
            {formData.currentImageUrl && (
              <div className="mb-2">
                <SignedImage
                  src={formData.currentImageUrl}
                  alt="Current LGA image"
                  className="w-32 h-24 object-cover rounded border"
                />
                <p className="text-sm text-muted-foreground">Current image</p>
              </div>
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    setError('Image size must be less than 5MB')
                    return
                  }
                  setFormData(prev => ({ ...prev, image: file }))
                  setError('')
                } else {
                  setFormData(prev => ({ ...prev, image: null }))
                }
              }}
            />
            {formData.image && (
              <p className="text-sm text-muted-foreground">
                New image: {formData.image.name} ({(formData.image.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="min-h-[150px]">
              <RichTextEditor
                value={formData.description}
                onChange={(value) => updateField('description', value)}
                placeholder="Enter description..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmarks">Landmarks (comma-separated)</Label>
            <Textarea
              id="landmarks"
              value={formData.landmarks}
              onChange={(e) => updateField('landmarks', e.target.value)}
              placeholder="Market Square, Town Hall, Central Mosque"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activities">Economic Activities (comma-separated)</Label>
            <Textarea
              id="activities"
              value={formData.activities}
              onChange={(e) => updateField('activities', e.target.value)}
              placeholder="Agriculture, Trading, Manufacturing"
              rows={2}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? `${lgaId ? 'Updating' : 'Creating'}...` : `${lgaId ? 'Update' : 'Create'} LGA`}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
