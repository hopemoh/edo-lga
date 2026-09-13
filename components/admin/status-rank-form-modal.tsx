"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus } from "lucide-react"
import { motion } from "framer-motion"

interface StatusRankFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function StatusRankFormModal({ open, onClose, onSuccess }: StatusRankFormModalProps) {
  const [statuses, setStatuses] = useState<any[]>([])
  const [ranks, setRanks] = useState<any[]>([])
  const [qualifications, setQualifications] = useState<any[]>([])
  const [newStatus, setNewStatus] = useState("")
  const [newRank, setNewRank] = useState("")
  const [newQualification, setNewQualification] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    try {
      const [statusRes, rankRes, qualRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/ranks'),
        fetch('/api/qualifications')
      ])

      if (statusRes.ok) setStatuses(await statusRes.json())
      if (rankRes.ok) setRanks(await rankRes.json())
      if (qualRes.ok) setQualifications(await qualRes.json())
    } catch (error) {
    }
  }

  const addStatus = async () => {
    if (!newStatus.trim()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newStatus.trim() })
      })

      if (response.ok) {
        setNewStatus("")
        fetchData()
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

  const addRank = async () => {
    if (!newRank.trim()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ranks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newRank.trim() })
      })

      if (response.ok) {
        setNewRank("")
        fetchData()
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

  const deleteStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/status/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Couldn't save your changes. Please try again.")
        return
      }
      
      if (response.ok) fetchData()
    } catch (error) {
      alert("Couldn't save your changes. Please try again.")
    }
  }

  const deleteRank = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/ranks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Couldn't save your changes. Please try again.")
        return
      }
      
      if (response.ok) fetchData()
    } catch (error) {
      alert("Couldn't save your changes. Please try again.")
    }
  }

  const addQualification = async () => {
    if (!newQualification.trim()) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/qualifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newQualification.trim() })
      })

      if (response.ok) {
        setNewQualification("")
        fetchData()
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

  const deleteQualification = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/qualifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || "Couldn't save your changes. Please try again.")
        return
      }
      
      if (response.ok) fetchData()
    } catch (error) {
      alert("Couldn't save your changes. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Status, Ranks & Qualifications</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="ranks">Ranks</TabsTrigger>
            <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter new status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStatus()}
              />
              <Button onClick={addStatus} disabled={loading || !newStatus.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {statuses.map((status) => (
                <motion.div
                  key={status.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span>{status.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteStatus(status.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ranks" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter new rank"
                value={newRank}
                onChange={(e) => setNewRank(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRank()}
              />
              <Button onClick={addRank} disabled={loading || !newRank.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ranks.map((rank) => (
                <motion.div
                  key={rank.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span>{rank.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRank(rank.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="qualifications" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter new qualification"
                value={newQualification}
                onChange={(e) => setNewQualification(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addQualification()}
              />
              <Button onClick={addQualification} disabled={loading || !newQualification.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {qualifications.map((qual) => (
                <motion.div
                  key={qual.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span>{qual.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQualification(qual.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
