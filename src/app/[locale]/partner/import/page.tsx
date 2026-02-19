"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, Download, AlertCircle } from "lucide-react"

interface ImportResult {
  row: number
  success: boolean
  error?: string
  licensePlate?: string
}

interface ImportResponse {
  success: boolean
  message: string
  imported: number
  errors: number
  total: number
  results: ImportResult[]
  error?: string
}

export default function ImportPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)

  const partnerId = user?.partnerId

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !partnerId) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/partner/import", {
        method: "POST",
        body: formData,
      })

      const data: ImportResponse = await response.json()

      if (response.ok) {
        setImportResult(data)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setImportResult({
          success: false,
          message: data.error || "เกิดข้อผิดพลาด",
          imported: 0,
          errors: 0,
          total: 0,
          results: [],
        } as ImportResponse)
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({
        success: false,
        message: "เกิดข้อผิดพลาดในการเชื่อมต่อ",
        imported: 0,
        errors: 0,
        total: 0,
        results: [],
      } as ImportResponse)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const bom = "\uFEFF"
    const headers = "ยี่ห้อ,รุ่น,ปี,ทะเบียน,ประเภท,เกียร์,เชื้อเพลิง,ที่นั่ง,ประตู,ราคา/วัน"
    const example1 = "Toyota,Yaris,2024,กข 1234,SEDAN,AUTO,PETROL,5,4,800"
    const example2 = "Honda,Civic,2023,ขก 5678,SEDAN,AUTO,PETROL,5,4,1200"
    const csv = `${bom}${headers}\n${example1}\n${example2}`

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "import_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Import รถ</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            นำเข้าข้อมูลรถจากไฟล์ CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Download */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-blue-700 font-medium">รูปแบบไฟล์ CSV</p>
                <p className="text-sm text-blue-600">
                  ดาวน์โหลดไฟล์ตัวอย่างเพื่อดูรูปแบบที่ถูกต้อง หรือใช้ไฟล์จากการ Export
                </p>
                <div className="text-xs text-blue-500 space-y-1">
                  <p>ประเภท: SEDAN, SUV, VAN, PICKUP, LUXURY, COMPACT, MOTORCYCLE</p>
                  <p>เกียร์: AUTO, MANUAL</p>
                  <p>เชื้อเพลิง: PETROL, DIESEL, HYBRID, EV</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลดไฟล์ตัวอย่าง
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors text-center"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              {selectedFile ? (
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  คลิกเพื่อเลือกไฟล์ CSV (สูงสุด 5MB)
                </p>
              )}
            </button>
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลัง Import...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import ข้อมูลรถ
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              ผลลัพธ์การ Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                <p className="text-sm text-green-700">สำเร็จ</p>
              </div>
              <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                <p className="text-sm text-red-700">ผิดพลาด</p>
              </div>
              <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-600">{importResult.total}</p>
                <p className="text-sm text-gray-700">ทั้งหมด</p>
              </div>
            </div>

            {importResult.imported > 0 && (
              <p className="text-sm text-amber-600">
                * รถที่ Import จะมีสถานะ &quot;รอตรวจสอบ&quot; ต้องรอ Admin อนุมัติก่อนแสดงในเว็บไซต์
              </p>
            )}

            {importResult.results && importResult.results.length > 0 && (
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">แถว</th>
                      <th className="text-left p-2">ทะเบียน</th>
                      <th className="text-left p-2">สถานะ</th>
                      <th className="text-left p-2">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.results.map((result, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{result.row}</td>
                        <td className="p-2">{result.licensePlate || "-"}</td>
                        <td className="p-2">
                          {result.success ? (
                            <Badge className="bg-green-100 text-green-800">สำเร็จ</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">ผิดพลาด</Badge>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{result.error || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
