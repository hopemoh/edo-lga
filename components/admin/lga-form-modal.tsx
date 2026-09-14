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
import { useLGA, useUpdateLGA } from "@/hooks/use-lgas"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { lgaDetailSchema } from "@/lib/validations"
import type { z } from "zod"

type LGAFormValues = z.infer<typeof lgaDetailSchema>

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
  const [error, setError] = useState("")

  const { data: lga } = useLGA(lgaId || "")
  const updateLGA = useUpdateLGA()

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<LGAFormValues>({
    resolver: zodResolver(lgaDetailSchema),
    defaultValues: {
      lgaId: "",
      description: "",
    },
  })

  useEffect(() => {
    if (lga) {
      const newFormData = {
        id: lga.id,
        name: lga.name,
        zone: lga.zone || "Northern",
        description: lga.details?.description || "",
        landmarks: lga.details?.landmarks?.join(", ") || "",
        activities: lga.details?.activities?.join(", ") || "",
        image: null,
        currentImageUrl: lga.details?.image || ""
      }
      setFormData(newFormData)
      reset({
        lgaId: lga.id,
        description: newFormData.description,
      })
    } else if (open && !lgaId) {
      const empty = {
        id: "", name: "", zone: "Northern", description: "",
        landmarks: "", activities: "",
        image: null, currentImageUrl: ""
      }
      setFormData(empty)
      reset({ lgaId: "", description: "" })
    }
  }, [lga, lgaId, open, reset])

  const handleFormSubmit = (data: LGAFormValues) => {
    setError("")

    const formDataToSend = new FormData()

    formDataToSend.append('name', formData.name)
    formDataToSend.append('zone', formData.zone)
    formDataToSend.append('description', data.description || "")
    formDataToSend.append('landmarks', formData.landmarks)
    formDataToSend.append('activities', formData.activities)

    if (formData.image) {
      formDataToSend.append('image', formData.image)
    }

    if (!lgaId) {
      formDataToSend.append('id', formData.id.toLowerCase().replace(/\s+/g, '-'))
    }

    if (lgaId) {
      updateLGA.mutate({ id: lgaId, data: formDataToSend }, {
        onSuccess: () => {
          setFormData({
            id: "", name: "", zone: "Northern", description: "",
            landmarks: "", activities: "",
            image: null, currentImageUrl: ""
          })
          reset()
          onSuccess()
          onClose()
        },
        onError: (err: any) => {
          setError(err.message || "Couldn't save your changes. Please try again.")
        }
      })
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
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 antialiased"
        >
          <input type="hidden" {...register("lgaId")} />

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
                onChange={(value) => {
                  updateField('description', value)
                  setValue("description", value)
                }}
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
            <Button type="submit" disabled={updateLGA.isPending} className="flex-1">
              {updateLGA.isPending ? `${lgaId ? 'Updating' : 'Creating'}...` : `${lgaId ? 'Update' : 'Create'} LGA`}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
