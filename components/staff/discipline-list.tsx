"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldAlert, CheckCircle2, Clock, AlertCircle, Search, Edit2, Settings, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import DisciplineFormModal from "@/components/admin/discipline-form-modal"
import SanctionManagementModal from "@/components/admin/sanction-management-modal"
import RichTextDisplay from "@/components/ui/rich-text-display"

interface DisciplinaryCase {
    id: string
    staffId: string
    title: string
    description: string
    status: string
    sanction: string | null
    dateReported: string
    dateResolved: string | null
    staff: {
        name: string
        lga: {
            name: string
        }
    }
}

interface DisciplineListProps {
    isAdmin?: boolean
}

export default function DisciplineList({ isAdmin = false }: DisciplineListProps) {
    const [cases, setCases] = useState<DisciplinaryCase[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false)
    const [editingCase, setEditingCase] = useState<DisciplinaryCase | null>(null)

    useEffect(() => {
        fetchCases()
    }, [])

    const fetchCases = async () => {
        try {
            const response = await fetch('/api/disciplinary')
            if (response.ok) {
                const data = await response.json()
                setCases(data)
            }
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (c: DisciplinaryCase) => {
        setEditingCase(c)
        setIsFormOpen(true)
    }

    const handleAdd = () => {
        setEditingCase(null)
        setIsFormOpen(true)
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'resolved':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case 'pending':
                return <Clock className="w-4 h-4 text-amber-500" />
            case 'under review':
                return <AlertCircle className="w-4 h-4 text-blue-500" />
            default:
                return <ShieldAlert className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'resolved':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Resolved</Badge>
            case 'pending':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">Pending</Badge>
            case 'under review':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Under Review</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const filteredCases = cases.filter(c =>
        c.staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.staff.lga.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Disciplinary Cases</h2>
                    <p className="text-sm text-muted-foreground">Manage and track staff disciplinary actions and sanctions</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search staff or case..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <>
                            <Button variant="outline" size="icon" onClick={() => setIsSanctionModalOpen(true)} title="Manage Sanctions">
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleAdd}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Case
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Card className="border-border/50 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>LGA</TableHead>
                            <TableHead>Case Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sanction</TableHead>
                            <TableHead>Date Reported</TableHead>
                            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCases.map((c) => (
                            <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium">{c.staff.name}</TableCell>
                                <TableCell>{c.staff.lga.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        
                                         <RichTextDisplay
                                          content={c.title}
                                          className="text-lg text-muted-foreground"
                                        />
                              
                                       
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(c.status)}
                                        {getStatusBadge(c.status)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {c.sanction && c.sanction !== 'none' ? (
                                        <Badge variant="secondary" className="font-normal">
                                            {c.sanction}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs italic">None yet</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(c.dateReported), 'MMM dd, yyyy')}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {filteredCases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center text-muted-foreground">
                                    No disciplinary cases found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <DisciplineFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={fetchCases}
                initialData={editingCase}
            />

            <SanctionManagementModal
                open={isSanctionModalOpen}
                onClose={() => setIsSanctionModalOpen(false)}
            />
        </div>
    )
}

