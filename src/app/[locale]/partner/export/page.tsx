"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, FileSpreadsheet, Calendar, Loader2 } from "lucide-react"

export default function ExportPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [exportType, setExportType] = useState("bookings")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const partnerId = user?.partnerId

  const handleExport = async () => {
    if (!partnerId) return
    
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      params.append("partnerId", partnerId)
      params.append("type", exportType)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/partner/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `export_${Date.now()}.csv`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      alert("เกิดข้อผิดพลาดในการ Export กรุณาลองใหม่")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">{t("partner.export")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            ส่งออกข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>ประเภทข้อมูล</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">การจอง (Bookings)</SelectItem>
                <SelectItem value="revenue">รายได้ (Revenue)</SelectItem>
                <SelectItem value="cars">รถ (Cars)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                ตั้งแต่วันที่
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                ถึงวันที่
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลัง Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            ไฟล์จะถูกดาวน์โหลดในรูปแบบ CSV ที่สามารถเปิดใน Excel ได้
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
