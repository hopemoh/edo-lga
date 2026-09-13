"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, FileText } from "lucide-react"
import { motion } from "framer-motion"

interface ChangeReason {
  id: string
  name: string
  requiresDocument: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ChangeReasonsManagerProps {
  open: boolean
  onClose: () => void
}

export default function ChangeReasonsManager({ open, onClose }: ChangeReasonsManagerProps) {
  const [reasons, setReasons] = useState<ChangeReason[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReason, setNewReason] = useState({ name: '', requiresDocument: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchReasons()
    }
  }, [open])

  const fetchReasons = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/change-reasons', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setReasons(data)
      }
    } catch (error) {
    }
  }

  const handleAddReason = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newReason.name.trim()) {
      setError("Reason name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/change-reasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReason)
      })

      if (response.ok) {
        const createdReason = await response.json()
        setReasons(prev => [...prev, createdReason])
        setNewReason({ name: '', requiresDocument: false })
        setShowAddForm(false)
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

  const toggleReasonStatus = async (reasonId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/change-reasons/${reasonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        setReasons(prev => prev.map(reason => 
          reason.id === reasonId 
            ? { ...reason, isActive: !isActive }
            : reason
        ))
      }
    } catch (error) {
    }
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
                        value={newReason.name}
                        onChange={(e) => setNewReason(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Change of marital status"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requires-document"
                        checked={newReason.requiresDocument}
                        onCheckedChange={(checked) => 
                          setNewReason(prev => ({ ...prev, requiresDocument: checked as boolean }))
                        }
                      />
                      <Label htmlFor="requires-document" className="text-sm">
                        Requires supporting document
                      </Label>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowAddForm(false)
                          setNewReason({ name: '', requiresDocument: false })
                          setError("")
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? "Adding..." : "Add Reason"}
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
                {reasons.map((reason) => (
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
