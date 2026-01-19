"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2 } from "lucide-react"
import Image from "next/image"

interface BannerData {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  position: string
  sortOrder: number
  isActive: boolean
  startDate: string | null
  endDate: string | null
}

export default function BannersPage() {
  const t = useTranslations()
  const [banners, setBanners] = useState<BannerData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    position: "HOMEPAGE_HERO",
    linkUrl: "",
    sortOrder: "1",
    startDate: "",
    endDate: "",
    isActive: true,
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/cms/banners")
      const data = await response.json()
      setBanners(data.banners || [])
    } catch (error) {
      console.error("Error fetching banners:", error)
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  const positionLabels: Record<string, string> = {
    HOMEPAGE_HERO: "หน้าแรก (Hero)",
    HOMEPAGE_MIDDLE: "หน้าแรก (Middle)",
    LISTING_TOP: "หน้ารายการรถ",
    POPUP: "Popup",
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบ Banner นี้?")) return

    try {
      const response = await fetch(`/api/admin/cms/banners/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchBanners()
      }
    } catch (error) {
      console.error("Error deleting banner:", error)
    }
  }

  const handleToggleActive = async (banner: BannerData) => {
    try {
      await fetch(`/api/admin/cms/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      })
      fetchBanners()
    } catch (error) {
      console.error("Error toggling banner:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      position: "HOMEPAGE_HERO",
      linkUrl: "",
      sortOrder: "1",
      startDate: "",
      endDate: "",
      isActive: true,
    })
    setEditingBanner(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
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
        <h1 className="text-3xl font-bold">Banners</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่ม Banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "แก้ไข Banner" : "เพิ่ม Banner"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อ</Label>
                <Input 
                  placeholder="ชื่อ Banner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ตำแหน่ง</Label>
                <Select 
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกตำแหน่ง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOMEPAGE_HERO">หน้าแรก (Hero)</SelectItem>
                    <SelectItem value="HOMEPAGE_MIDDLE">หน้าแรก (Middle)</SelectItem>
                    <SelectItem value="LISTING_TOP">หน้ารายการรถ</SelectItem>
                    <SelectItem value="POPUP">Popup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>รูปภาพ</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">คลิกเพื่ออัพโหลด</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Link URL (optional)</Label>
                <Input 
                  placeholder="https://..."
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วันเริ่มต้น</Label>
                  <Input 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันสิ้นสุด</Label>
                  <Input 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>เปิดใช้งาน</Label>
                <Switch 
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={() => setIsDialogOpen(false)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-4" />
              <p>ยังไม่มี Banner</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banner</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center overflow-hidden relative">
                          {banner.imageUrl ? (
                            <Image
                              src={banner.imageUrl}
                              alt={banner.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{banner.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {positionLabels[banner.position] || banner.position}
                      </Badge>
                    </TableCell>
                    <TableCell>{banner.sortOrder}</TableCell>
                    <TableCell>
                      {banner.startDate && banner.endDate
                        ? `${formatDate(banner.startDate)} - ${formatDate(banner.endDate)}`
                        : "ไม่จำกัด"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          banner.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.isActive}
                          onCheckedChange={() => handleToggleActive(banner)}
                        />
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
