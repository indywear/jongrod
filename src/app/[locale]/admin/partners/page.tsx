"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Loader2, Eye, Edit } from "lucide-react"
import { toast } from "sonner"

interface Partner {
  id: string
  name: string
  contactEmail: string
  phone: string
  commissionRate: number
  status: string
  _count: { cars: number; bookings?: number }
}

interface PartnerDetail extends Partner {
  cars: { id: string; brand: string; model: string; year: number; rentalStatus: string }[]
  admins: { user: { id: string; firstName: string; lastName: string; email: string } }[]
}

export default function AdminPartnersPage() {
  const t = useTranslations("admin")
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<PartnerDetail | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    commissionRate: "",
    status: "ACTIVE",
  })

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/partners?limit=500")
      const data = await response.json()
      setPartners(data.partners || [])
    } catch (error) {
      console.error("Error fetching partners:", error)
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPartnerDetail = async (id: string) => {
    setViewLoading(true)
    try {
      const response = await fetch(`/api/admin/partners/${id}`)
      const data = await response.json()
      return data.partner as PartnerDetail
    } catch (error) {
      console.error("Error fetching partner:", error)
      return null
    } finally {
      setViewLoading(false)
    }
  }

  const handleView = async (partner: Partner) => {
    setShowViewDialog(true)
    const detail = await fetchPartnerDetail(partner.id)
    setSelectedPartner(detail)
  }

  const handleEdit = (partner: Partner) => {
    setEditForm({
      name: partner.name,
      contactEmail: partner.contactEmail,
      phone: partner.phone,
      commissionRate: String(partner.commissionRate),
      status: partner.status,
    })
    setSelectedPartner(partner as PartnerDetail)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPartner) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          contactEmail: editForm.contactEmail,
          phone: editForm.phone,
          commissionRate: parseFloat(editForm.commissionRate),
          status: editForm.status,
        }),
      })

      if (response.ok) {
        toast.success("บันทึกข้อมูลพาร์ทเนอร์สำเร็จ")
        setShowEditDialog(false)
        fetchPartners()
      } else {
        const data = await response.json()
        toast.error(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }
    } catch (error) {
      console.error("Error saving partner:", error)
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">ใช้งาน</Badge>
      case "SUSPENDED":
        return <Badge className="bg-red-100 text-red-800">ระงับ</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">รอตรวจสอบ</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("partners")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพาร์ทเนอร์ทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ยังไม่มีพาร์ทเนอร์</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อร้าน</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>โทรศัพท์</TableHead>
                    <TableHead>ค่าคอมมิชชั่น</TableHead>
                    <TableHead>จำนวนรถ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.contactEmail}</TableCell>
                      <TableCell>{partner.phone}</TableCell>
                      <TableCell>{partner.commissionRate}%</TableCell>
                      <TableCell>{partner._count?.cars || 0} คัน</TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(partner)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>รายละเอียดพาร์ทเนอร์</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedPartner ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อร้าน</p>
                  <p className="font-medium">{selectedPartner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สถานะ</p>
                  {getStatusBadge(selectedPartner.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">อีเมล</p>
                  <p>{selectedPartner.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">โทรศัพท์</p>
                  <p>{selectedPartner.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ค่าคอมมิชชั่น</p>
                  <p className="font-bold">{selectedPartner.commissionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">จำนวนรถ</p>
                  <p>{selectedPartner._count?.cars || 0} คัน</p>
                </div>
              </div>
              {selectedPartner.admins && selectedPartner.admins.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ผู้ดูแล</p>
                  <div className="space-y-1">
                    {selectedPartner.admins.map((admin) => (
                      <p key={admin.user.id} className="text-sm">
                        {admin.user.firstName} {admin.user.lastName} ({admin.user.email})
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {selectedPartner.cars && selectedPartner.cars.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    รถทั้งหมด ({selectedPartner.cars.length} คัน)
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedPartner.cars.map((car) => (
                      <div key={car.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <span>{car.brand} {car.model} {car.year}</span>
                        <Badge variant="outline" className="text-xs">
                          {car.rentalStatus === "AVAILABLE" ? "ว่าง" : car.rentalStatus === "RENTED" ? "ถูกเช่า" : "ซ่อมบำรุง"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขพาร์ทเนอร์</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อร้าน</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>โทรศัพท์</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ค่าคอมมิชชั่น (%)</Label>
                <Input
                  type="number"
                  value={editForm.commissionRate}
                  onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ใช้งาน</SelectItem>
                    <SelectItem value="SUSPENDED">ระงับ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editForm.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
