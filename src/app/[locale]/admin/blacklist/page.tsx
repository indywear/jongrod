"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Ban, Loader2 } from "lucide-react"

interface BlacklistEntry {
  id: string
  documentNumber: string
  fullName: string
  phone: string | null
  email: string | null
  reason: string
  createdAt: string
  addedBy?: {
    firstName: string
    lastName: string
  }
}

interface UserData {
  id: string
  role: string
}

export default function BlacklistPage() {
  const t = useTranslations("admin")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  
  const [formData, setFormData] = useState({
    documentNumber: "",
    fullName: "",
    phone: "",
    email: "",
    reason: "",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
    fetchBlacklist()
  }, [])

  const fetchBlacklist = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/blacklist")
      const data = await response.json()
      setBlacklist(data.blacklist || [])
    } catch (error) {
      console.error("Error fetching blacklist:", error)
      setBlacklist([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !formData.documentNumber || !formData.fullName || !formData.reason) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          addedById: user.id,
        }),
      })

      if (response.ok) {
        setFormData({
          documentNumber: "",
          fullName: "",
          phone: "",
          email: "",
          reason: "",
        })
        setIsDialogOpen(false)
        fetchBlacklist()
      }
    } catch (error) {
      console.error("Error adding to blacklist:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบรายการนี้ออกจาก Blacklist?")) return

    try {
      const response = await fetch(`/api/admin/blacklist?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchBlacklist()
      }
    } catch (error) {
      console.error("Error deleting blacklist entry:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("blacklist")}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่ม Blacklist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มรายชื่อ Blacklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>เลขบัตรประชาชน *</Label>
                <Input 
                  placeholder="x-xxxx-xxxxx-xx-x"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ชื่อ-นามสกุล *</Label>
                <Input 
                  placeholder="ชื่อเต็ม"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เบอร์โทร</Label>
                  <Input 
                    placeholder="0xx-xxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input 
                    type="email" 
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>เหตุผล *</Label>
                <Textarea 
                  placeholder="ระบุเหตุผลในการ blacklist..." 
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saving || !formData.documentNumber || !formData.fullName || !formData.reason}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {blacklist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Ban className="h-12 w-12 mb-4" />
              <p>ไม่มีรายชื่อใน Blacklist</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>เลขบัตร</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>วันที่เพิ่ม</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklist.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{item.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{item.documentNumber}</TableCell>
                    <TableCell>{item.phone || "-"}</TableCell>
                    <TableCell>{item.email || "-"}</TableCell>
                    <TableCell>
                      <p className="max-w-[200px] truncate" title={item.reason}>
                        {item.reason}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
