"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus } from "lucide-react"
import { motion } from "framer-motion"
import { useStatuses, useCreateStatus, useDeleteStatus, useRanks, useCreateRank, useDeleteRank, useQualifications, useCreateQualification, useDeleteQualification } from "@/hooks/use-resources"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { statusSchema, rankSchema, qualificationSchema } from "@/lib/validations"
import type { z } from "zod"

interface StatusRankFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function StatusRankFormModal({ open, onClose, onSuccess }: StatusRankFormModalProps) {
  const { data: statuses = [] } = useStatuses()
  const { data: ranks = [] } = useRanks()
  const { data: qualifications = [] } = useQualifications()

  const createStatus = useCreateStatus()
  const deleteStatus = useDeleteStatus()
  const createRank = useCreateRank()
  const deleteRank = useDeleteRank()
  const createQualification = useCreateQualification()
  const deleteQualification = useDeleteQualification()

  const statusForm = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: { name: "" },
  })

  const rankForm = useForm<z.infer<typeof rankSchema>>({
    resolver: zodResolver(rankSchema),
    defaultValues: { name: "" },
  })

  const qualificationForm = useForm<z.infer<typeof qualificationSchema>>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: { name: "" },
  })

  const addStatus = statusForm.handleSubmit((data) => {
    createStatus.mutate({ name: data.name.trim() }, {
      onSuccess: () => {
        statusForm.reset()
        onSuccess()
      },
    })
  })

  const addRank = rankForm.handleSubmit((data) => {
    createRank.mutate({ name: data.name.trim() }, {
      onSuccess: () => {
        rankForm.reset()
        onSuccess()
      },
    })
  })

  const addQualification = qualificationForm.handleSubmit((data) => {
    createQualification.mutate({ name: data.name.trim() }, {
      onSuccess: () => {
        qualificationForm.reset()
        onSuccess()
      },
    })
  })

  const handleDeleteStatus = (id: string) => {
    deleteStatus.mutate(id, {
      onSuccess: () => onSuccess(),
      onError: () => alert("Couldn't save your changes. Please try again.")
    })
  }

  const handleDeleteRank = (id: string) => {
    deleteRank.mutate(id, {
      onSuccess: () => onSuccess(),
      onError: () => alert("Couldn't save your changes. Please try again.")
    })
  }

  const handleDeleteQualification = (id: string) => {
    deleteQualification.mutate(id, {
      onSuccess: () => onSuccess(),
      onError: () => alert("Couldn't save your changes. Please try again.")
    })
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
            <form onSubmit={addStatus} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Enter new status"
                  {...statusForm.register("name")}
                />
                {statusForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{statusForm.formState.errors.name.message}</p>
                )}
              </div>
              <Button type="submit" disabled={createStatus.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {statuses.map((status: any) => (
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
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ranks" className="space-y-4">
            <form onSubmit={addRank} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Enter new rank"
                  {...rankForm.register("name")}
                />
                {rankForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{rankForm.formState.errors.name.message}</p>
                )}
              </div>
              <Button type="submit" disabled={createRank.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ranks.map((rank: any) => (
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
                    onClick={() => handleDeleteRank(rank.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="qualifications" className="space-y-4">
            <form onSubmit={addQualification} className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Enter new qualification"
                  {...qualificationForm.register("name")}
                />
                {qualificationForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{qualificationForm.formState.errors.name.message}</p>
                )}
              </div>
              <Button type="submit" disabled={createQualification.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {qualifications.map((qual: any) => (
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
                    onClick={() => handleDeleteQualification(qual.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
