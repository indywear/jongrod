"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Building2, Clock, Bell, Upload, MapPin, Plus, X, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00", "23:30", "00:00"
]

interface PartnerData {
  id: string
  name: string
  phone: string
  contactEmail: string
  minAdvanceHours: number
  telegramChatId: string | null
  operatingHours: OperatingHours | null
  pickupLocations: string[]
}

interface OperatingHours {
  [key: string]: { open: string; close: string; isOpen: boolean }
}

export default function SettingsPage() {
  const t = useTranslations()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [newLocation, setNewLocation] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    minAdvanceHours: 24,
    telegramChatId: "",
  })

  const [pickupLocations, setPickupLocations] = useState<string[]>([])

  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    monday: { open: "08:00", close: "18:00", isOpen: true },
    tuesday: { open: "08:00", close: "18:00", isOpen: true },
    wednesday: { open: "08:00", close: "18:00", isOpen: true },
    thursday: { open: "08:00", close: "18:00", isOpen: true },
    friday: { open: "08:00", close: "18:00", isOpen: true },
    saturday: { open: "09:00", close: "17:00", isOpen: true },
    sunday: { open: "09:00", close: "17:00", isOpen: false },
  })

  const dayNames: Record<string, string> = {
    monday: "วันจันทร์",
    tuesday: "วันอังคาร",
    wednesday: "วันพุธ",
    thursday: "วันพฤหัสบดี",
    friday: "วันศุกร์",
    saturday: "วันเสาร์",
    sunday: "วันอาทิตย์",
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        const pId = userData.partnerId || "av-carrent-official"
        setPartnerId(pId)
      } catch {
        setPartnerId("av-carrent-official")
      }
    } else {
      setPartnerId("av-carrent-official")
    }
  }, [])

  useEffect(() => {
    if (partnerId) {
      fetchPartnerSettings()
    }
  }, [partnerId])

  const fetchPartnerSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/partner/settings?partnerId=${partnerId}`)
      const data = await response.json()
      if (data.partner) {
        const partner: PartnerData = data.partner
        setFormData({
          name: partner.name || "",
          phone: partner.phone || "",
          email: partner.contactEmail || "",
          address: "",
          minAdvanceHours: partner.minAdvanceHours || 24,
          telegramChatId: partner.telegramChatId || "",
        })
        if (partner.operatingHours) {
          setOperatingHours(partner.operatingHours)
        }
        setPickupLocations(Array.isArray(partner.pickupLocations) ? partner.pickupLocations : [])
      }
    } catch (error) {
      console.error("Error fetching partner settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addLocation = () => {
    if (newLocation.trim() && !pickupLocations.includes(newLocation.trim())) {
      setPickupLocations([...pickupLocations, newLocation.trim()])
      setNewLocation("")
    }
  }

  const removeLocation = (location: string) => {
    setPickupLocations(pickupLocations.filter(l => l !== location))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerId) return

    setSaving(true)
    try {
      const response = await fetch("/api/partner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          name: formData.name,
          phone: formData.phone,
          contactEmail: formData.email,
          minAdvanceHours: parseInt(formData.minAdvanceHours.toString()),
          telegramChatId: formData.telegramChatId || null,
          operatingHours,
          pickupLocations,
        }),
      })

      if (response.ok) {
        alert("บันทึกการตั้งค่าสำเร็จ")
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t("partner.settings")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              ข้อมูลร้าน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <Button variant="outline" type="button">
                <Upload className="h-4 w-4 mr-2" />
                อัพโหลดโลโก้
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>ชื่อร้าน</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เบอร์โทร</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ที่อยู่</Label>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              สถานที่รับ-คืนรถ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              กำหนดสถานที่ที่ลูกค้าสามารถรับและคืนรถได้
            </p>

            <div className="flex flex-wrap gap-2">
              {pickupLocations.map((location, index) => (
                <Badge key={index} variant="secondary" className="py-1.5 px-3 text-sm">
                  {location}
                  <button
                    type="button"
                    onClick={() => removeLocation(location)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {pickupLocations.length === 0 && (
                <p className="text-sm text-muted-foreground">ยังไม่มีสถานที่กำหนด</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="เพิ่มสถานที่ใหม่ เช่น สนามบินสุวรรณภูมิ"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addLocation()
                  }
                }}
              />
              <Button type="button" onClick={addLocation} variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                เพิ่ม
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              เวลาทำการ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28">
                  <span className="text-sm font-medium">{dayNames[day]}</span>
                </div>
                <Switch
                  checked={hours.isOpen}
                  onCheckedChange={(checked) =>
                    setOperatingHours((prev) => ({
                      ...prev,
                      [day]: { ...prev[day], isOpen: checked },
                    }))
                  }
                />
                {hours.isOpen && (
                  <>
                    <Select
                      value={hours.open}
                      onValueChange={(value) =>
                        setOperatingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], open: value },
                        }))
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="เปิด" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={`open-${time}`} value={time}>
                            {time} น.
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>-</span>
                    <Select
                      value={hours.close}
                      onValueChange={(value) =>
                        setOperatingHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], close: value },
                        }))
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="ปิด" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={`close-${time}`} value={time}>
                            {time} น.
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                {!hours.isOpen && (
                  <span className="text-sm text-muted-foreground">ปิดทำการ</span>
                )}
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <Label>จองล่วงหน้าขั้นต่ำ (ชั่วโมง)</Label>
              <Input
                type="number"
                name="minAdvanceHours"
                value={formData.minAdvanceHours}
                onChange={handleInputChange}
                min={1}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                ลูกค้าต้องจองล่วงหน้าอย่างน้อยกี่ชั่วโมง
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              การแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Telegram Chat ID</Label>
              <Input
                name="telegramChatId"
                value={formData.telegramChatId}
                onChange={handleInputChange}
                placeholder="เช่น -1001234567890"
              />
              <p className="text-sm text-muted-foreground">
                ใส่ Chat ID เพื่อรับแจ้งเตือน Lead ใหม่ผ่าน Telegram
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
