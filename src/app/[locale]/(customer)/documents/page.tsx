"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Check, X, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"

interface DocumentData {
  id: string
  type: "ID_CARD" | "DRIVER_LICENSE"
  documentNumber: string
  frontImageUrl: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason: string | null
  createdAt: string
}

export default function DocumentsPage() {
  const t = useTranslations()
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/customer/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            {t("documents.status.PENDING")}
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800">
            {t("documents.status.APPROVED")}
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800">
            {t("documents.status.REJECTED")}
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Check className="h-5 w-5 text-green-600" />
      case "REJECTED":
        return <X className="h-5 w-5 text-red-600" />
      case "PENDING":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "ID_CARD":
        return t("documents.idCard")
      case "DRIVER_LICENSE":
        return t("documents.driverLicense")
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{t("documents.title")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("documents.description") || "เอกสารที่อัปโหลดสำหรับการเช่ารถ"}
      </p>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4" />
            <p>ยังไม่มีเอกสาร</p>
            <p className="text-sm mt-1">เอกสารจะปรากฏที่นี่หลังจากทำการจองและอัปโหลด</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    {getDocTypeLabel(doc.type)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    {getStatusBadge(doc.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">ด้านหน้า</p>
                    <div className="w-40 aspect-[3/2] bg-muted rounded-lg overflow-hidden relative">
                      {doc.frontImageUrl ? (
                        <Image
                          src={doc.frontImageUrl}
                          alt="ด้านหน้า"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="mt-3 text-sm text-muted-foreground">
                  <span>เลขอ้างอิง: {doc.documentNumber}</span>
                  <span className="mx-2">|</span>
                  <span>ส่งเมื่อ: {new Date(doc.createdAt).toLocaleDateString("th-TH")}</span>
                </div>

                {doc.status === "REJECTED" && doc.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <p className="font-medium">เหตุผลที่ปฏิเสธ:</p>
                    <p>{doc.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
