"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { useChangeReasons, useCreateChangeReason, useUpdateChangeReason } from "@/hooks/use-resources"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { changeReasonSchema } from "@/lib/validations"

interface ChangeReasonsManagerProps {
  open: boolean
  onClose: () => void
}

export default function ChangeReasonsManager({ open, onClose }: ChangeReasonsManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: reasons = [] } = useChangeReasons()
  const createReason = useCreateChangeReason()
  const updateReason = useUpdateChangeReason()

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(changeReasonSchema),
    defaultValues: {
      name: "",
      description: "",
      requiresDocument: false,
      isActive: true,
    },
  })

  const handleAddReason = handleSubmit((data) => {
    createReason.mutate(data, {
      onSuccess: () => {
        reset()
        setShowAddForm(false)
      },
    })
  })

  const toggleReasonStatus = (reasonId: string, isActive: boolean) => {
    updateReason.mutate({ id: reasonId, data: { isActive: !isActive } })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manage Change Reasons
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Reason */}
          <div className="space-y-4">
            {!showAddForm ? (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Reason
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Change Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddReason} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reason-name">Reason Name *</Label>
                      <Input
                        id="reason-name"
                        {...register("name")}
                        placeholder="e.g., Change of marital status"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requires-document"
                        checked={watch("requiresDocument")}
                        onCheckedChange={(checked) =>
                          setValue("requiresDocument", checked as boolean)
                        }
                      />
                      <Label htmlFor="requires-document" className="text-sm">
                        Requires supporting document
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false)
                          reset()
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createReason.isPending} className="flex-1">
                        {createReason.isPending ? "Adding..." : "Add Reason"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Existing Reasons */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Existing Reasons</h3>
            {reasons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No change reasons found. Add one to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {reasons.map((reason: any) => (
                  <motion.div
                    key={reason.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`${!reason.isActive ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{reason.name}</h4>
                              {reason.requiresDocument && (
                                <Badge variant="secondary" className="text-xs">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Requires Document
                                </Badge>
                              )}
                              <Badge
                                variant={reason.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {reason.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(reason.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleReasonStatus(reason.id, reason.isActive)}
                              disabled={updateReason.isPending}
                            >
                              {reason.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
