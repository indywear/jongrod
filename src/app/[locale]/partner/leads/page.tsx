"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { 
  Eye, 
  HandHelping, 
  CarFront, 
  ClipboardList, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Pencil, 
  XCircle,
  RotateCcw
} from "lucide-react"

interface Lead {
  id: string
  bookingNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  car: { brand: string; model: string; year: number }
  pickupDate: string
  returnDate: string
  pickupLocation?: string
  returnLocation?: string
  customerNote?: string
  totalPrice: number
  status: string
  isBlacklisted?: boolean
}

export default function PartnerLeadsPage() {
  const t = useTranslations()
  const { user, isLoading: authLoading } = useAuth()
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    leadId: string
    newStatus: string
    title: string
    description: string
    isReject?: boolean
  } | null>(null)
  const [confirmNote, setConfirmNote] = useState("")

  const [editDialog, setEditDialog] = useState<{
    open: boolean
    lead: Lead | null
  }>({ open: false, lead: null })
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    pickupLocation: "",
    returnLocation: "",
    customerNote: "",
  })
  const [editOriginalReturn, setEditOriginalReturn] = useState("")
  const [saving, setSaving] = useState(false)

  const partnerId = user?.partnerId

  useEffect(() => {
    if (!authLoading && partnerId) {
      fetchLeads()
    }
  }, [statusFilter, authLoading, partnerId])

  const fetchLeads = async () => {
    if (!partnerId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("partnerId", partnerId)
      if (statusFilter !== "all") params.append("status", statusFilter)
      
      const response = await fetch(`/api/partner/leads?${params.toString()}`)
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error("Error fetching leads:", error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const updateLeadStatus = async (leadId: string, newStatus: string, note?: string) => {
    setProcessing(leadId)
    try {
      const response = await fetch(`/api/partner/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      })
      
      if (response.ok) {
        fetchLeads()
      } else {
        const data = await response.json()
        alert(data.error || "เกิดข้อผิดพลาดในการอัพเดตสถานะ")
      }
    } catch (error) {
      console.error("Error updating lead status:", error)
      alert("เกิดข้อผิดพลาดในการอัพเดตสถานะ")
    } finally {
      setProcessing(null)
    }
  }

  const openConfirmDialog = (leadId: string, newStatus: string, title: string, description: string, isReject = false) => {
    setConfirmDialog({ open: true, leadId, newStatus, title, description, isReject })
    setConfirmNote("")
  }

  const handleConfirm = async () => {
    if (confirmDialog) {
      if (confirmDialog.isReject && !confirmNote.trim()) {
        alert("กรุณาระบุเหตุผลในการปฏิเสธ")
        return
      }
      await updateLeadStatus(confirmDialog.leadId, confirmDialog.newStatus, confirmNote)
      setConfirmDialog(null)
      setConfirmNote("")
    }
  }

  const openEditDialog = (lead: Lead) => {
    setEditForm({
      customerName: lead.customerName,
      customerPhone: lead.customerPhone,
      customerEmail: lead.customerEmail || "",
      pickupDate: lead.pickupDate,
      pickupTime: "10:00",
      returnDate: lead.returnDate,
      returnTime: "10:00",
      pickupLocation: lead.pickupLocation || "",
      returnLocation: lead.returnLocation || "",
      customerNote: lead.customerNote || "",
    })
    setEditOriginalReturn(lead.returnDate)
    setEditDialog({ open: true, lead })
  }

  const handleSaveEdit = async () => {
    if (!editDialog.lead) return

    if (editForm.returnDate < editOriginalReturn) {
      alert("ไม่สามารถลดวันที่คืนรถได้ สามารถเพิ่มวันที่คืนรถได้เท่านั้น")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/partner/leads/${editDialog.lead.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName,
          customerPhone: editForm.customerPhone,
          customerEmail: editForm.customerEmail,
          pickupDatetime: editForm.pickupDate ? `${editForm.pickupDate}T${editForm.pickupTime}:00` : undefined,
          returnDatetime: editForm.returnDate ? `${editForm.returnDate}T${editForm.returnTime}:00` : undefined,
          pickupLocation: editForm.pickupLocation,
          returnLocation: editForm.returnLocation,
          customerNote: editForm.customerNote,
        }),
      })

      if (response.ok) {
        setEditDialog({ open: false, lead: null })
        fetchLeads()
      } else {
        const data = await response.json()
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }
    } catch (error) {
      console.error("Error saving edit:", error)
      alert("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      NEW: { label: "รอดำเนินการ", className: "bg-yellow-100 text-yellow-800" },
      CLAIMED: { label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-800" },
      PICKUP: { label: "รอรับรถ", className: "bg-purple-100 text-purple-800" },
      ACTIVE: { label: "กำลังใช้งาน", className: "bg-green-100 text-green-800" },
      RETURN: { label: "รอคืนรถ", className: "bg-orange-100 text-orange-800" },
      COMPLETED: { label: "เสร็จสิ้น", className: "bg-gray-100 text-gray-800" },
      CANCELLED: { label: "ยกเลิก", className: "bg-red-100 text-red-800" },
    }
    const { label, className } = statusMap[status] || statusMap.NEW
    return <Badge className={className}>{label}</Badge>
  }

  const getNextAction = (lead: Lead) => {
    const isProcessing = processing === lead.id
    
    switch (lead.status) {
      case "NEW":
        return (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => updateLeadStatus(lead.id, "CLAIMED")}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <HandHelping className="h-4 w-4 mr-2" />}
              รับงาน
            </Button>
            <Button 
              size="sm"
              variant="destructive"
              onClick={() => openConfirmDialog(
                lead.id, 
                "CANCELLED", 
                "ปฏิเสธการจอง",
                `คุณต้องการปฏิเสธการจองของ "${lead.customerName}" ใช่หรือไม่?`,
                true
              )}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              ปฏิเสธ
            </Button>
          </div>
        )
      case "CLAIMED":
        return (
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openConfirmDialog(
                lead.id, 
                "PICKUP", 
                "ยืนยันรับรถ",
                `คุณต้องการยืนยันว่าลูกค้า "${lead.customerName}" ได้รับรถเรียบร้อยแล้วใช่หรือไม่?`
              )}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CarFront className="h-4 w-4 mr-2" />}
              ยืนยันรับรถ
            </Button>
            <Button 
              size="sm"
              variant="destructive"
              onClick={() => openConfirmDialog(
                lead.id, 
                "CANCELLED", 
                "ปฏิเสธการจอง",
                `คุณต้องการปฏิเสธการจองของ "${lead.customerName}" ใช่หรือไม่?`,
                true
              )}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              ปฏิเสธ
            </Button>
          </div>
        )
      case "PICKUP":
        return (
          <Button 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => updateLeadStatus(lead.id, "ACTIVE")}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CarFront className="h-4 w-4 mr-2" />}
            เริ่มใช้งาน
          </Button>
        )
      case "ACTIVE":
        return (
          <Button 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => openConfirmDialog(
              lead.id, 
              "RETURN", 
              "ยืนยันคืนรถ",
              `คุณต้องการยืนยันว่าลูกค้า "${lead.customerName}" ได้คืนรถเรียบร้อยแล้วใช่หรือไม่?`
            )}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            ยืนยันคืนรถ
          </Button>
        )
      case "RETURN":
        return (
          <Button 
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => updateLeadStatus(lead.id, "COMPLETED")}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            เสร็จสิ้น
          </Button>
        )
      default:
        return null
    }
  }

  const canEdit = (status: string) => ["NEW", "CLAIMED"].includes(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("partner.leads")}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] sm:w-[180px]">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="NEW">รอดำเนินการ</SelectItem>
            <SelectItem value="CLAIMED">กำลังดำเนินการ</SelectItem>
            <SelectItem value="PICKUP">รอรับรถ</SelectItem>
            <SelectItem value="ACTIVE">กำลังใช้งาน</SelectItem>
            <SelectItem value="RETURN">รอคืนรถ</SelectItem>
            <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
            <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {authLoading || loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ยังไม่มี Lead ในขณะนี้</p>
              <p className="text-sm text-muted-foreground mt-2">
                เมื่อมีลูกค้าจองรถ รายการจะแสดงที่นี่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่จอง</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>รถ</TableHead>
                  <TableHead>วันรับ-คืน</TableHead>
                  <TableHead>ราคารวม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-mono">{lead.bookingNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lead.customerName}</p>
                          {lead.isBlacklisted && (
                            <Badge className="bg-red-600 text-white text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Blacklist
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead.customerPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{lead.car.brand} {lead.car.model} {lead.car.year}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{lead.pickupDate}</p>
                        <p className="text-muted-foreground">{lead.returnDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>{lead.totalPrice.toLocaleString()} THB</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>รายละเอียดการจอง</DialogTitle>
                            </DialogHeader>
                            {selectedLead && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      เลขที่จอง
                                    </p>
                                    <p className="font-mono">
                                      {selectedLead.bookingNumber}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      สถานะ
                                    </p>
                                    {getStatusBadge(selectedLead.status)}
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      ลูกค้า
                                    </p>
                                    <p>{selectedLead.customerName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      เบอร์โทร
                                    </p>
                                    <p>{selectedLead.customerPhone}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">รถ</p>
                                    <p>{selectedLead.car.brand} {selectedLead.car.model} {selectedLead.car.year}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      ราคารวม
                                    </p>
                                    <p className="font-bold">
                                      {selectedLead.totalPrice.toLocaleString()} THB
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {canEdit(lead.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(lead)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {getNextAction(lead)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDialog?.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-note">
                {confirmDialog?.isReject ? "เหตุผลในการปฏิเสธ *" : "หมายเหตุ (ไม่จำเป็น)"}
              </Label>
              <Textarea
                id="confirm-note"
                placeholder={confirmDialog?.isReject 
                  ? "กรุณาระบุเหตุผลในการปฏิเสธ เช่น เอกสารไม่ครบ, ข้อมูลไม่ถูกต้อง ฯลฯ" 
                  : "เช่น สภาพรถปกติ, ตรวจสอบเรียบร้อย, ฯลฯ"
                }
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={processing !== null}
              variant={confirmDialog?.isReject ? "destructive" : "default"}
            >
              {processing !== null ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : confirmDialog?.isReject ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, lead: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลการจอง</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลลูกค้าและวันที่ (เพิ่มวันคืนรถได้ แต่ลดไม่ได้)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อลูกค้า</Label>
                <Input
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>เบอร์โทร</Label>
                <Input
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input
                type="email"
                value={editForm.customerEmail}
                onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันรับรถ</Label>
                <Input
                  type="date"
                  value={editForm.pickupDate}
                  onChange={(e) => setEditForm({ ...editForm, pickupDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  วันคืนรถ
                  <span className="text-xs text-muted-foreground ml-1">(เพิ่มได้ ลดไม่ได้)</span>
                </Label>
                <Input
                  type="date"
                  value={editForm.returnDate}
                  min={editOriginalReturn}
                  onChange={(e) => setEditForm({ ...editForm, returnDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เวลารับรถ</Label>
                <Input
                  type="time"
                  value={editForm.pickupTime}
                  onChange={(e) => setEditForm({ ...editForm, pickupTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>เวลาคืนรถ</Label>
                <Input
                  type="time"
                  value={editForm.returnTime}
                  onChange={(e) => setEditForm({ ...editForm, returnTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>สถานที่รับรถ</Label>
                <Input
                  value={editForm.pickupLocation}
                  onChange={(e) => setEditForm({ ...editForm, pickupLocation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>สถานที่คืนรถ</Label>
                <Input
                  value={editForm.returnLocation}
                  onChange={(e) => setEditForm({ ...editForm, returnLocation: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea
                value={editForm.customerNote}
                onChange={(e) => setEditForm({ ...editForm, customerNote: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, lead: null })}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
