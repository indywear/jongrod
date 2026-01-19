"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Upload, Camera, Check, X, AlertCircle } from "lucide-react"

type DocStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED"

interface DocumentData {
  type: "ID_CARD" | "DRIVER_LICENSE"
  status: DocStatus
  frontUploaded: boolean
  backUploaded: boolean
  rejectionReason?: string
}

export default function DocumentsPage() {
  const t = useTranslations()

  const [documents, setDocuments] = useState<DocumentData[]>([
    {
      type: "ID_CARD",
      status: "APPROVED",
      frontUploaded: true,
      backUploaded: true,
    },
    {
      type: "DRIVER_LICENSE",
      status: "PENDING",
      frontUploaded: true,
      backUploaded: true,
    },
  ])

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "NONE":
        return (
          <Badge variant="outline" className="text-gray-600">
            ยังไม่อัพโหลด
          </Badge>
        )
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
    }
  }

  const getStatusIcon = (status: DocStatus) => {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{t("documents.title")}</h1>
      <p className="text-muted-foreground mb-8">
        อัพโหลดเอกสารเพื่อยืนยันตัวตนสำหรับการเช่ารถ
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("documents.idCard")}
              </CardTitle>
              {getStatusBadge(documents[0].status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("documents.front")}</p>
                <div className="aspect-[3/2] border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50 relative">
                  {documents[0].frontUploaded ? (
                    <>
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">อัพโหลดแล้ว</p>
                      {getStatusIcon(documents[0].status)}
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        คลิกเพื่ออัพโหลด
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("documents.back")}</p>
                <div className="aspect-[3/2] border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50">
                  {documents[0].backUploaded ? (
                    <>
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">อัพโหลดแล้ว</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        คลิกเพื่ออัพโหลด
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {documents[0].status !== "APPROVED" && (
              <div className="mt-4 flex justify-end">
                <Button>{t("documents.upload")}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("documents.driverLicense")}
              </CardTitle>
              {getStatusBadge(documents[1].status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("documents.front")}</p>
                <div className="aspect-[3/2] border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50">
                  {documents[1].frontUploaded ? (
                    <>
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">อัพโหลดแล้ว</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        คลิกเพื่ออัพโหลด
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("documents.back")}</p>
                <div className="aspect-[3/2] border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50">
                  {documents[1].backUploaded ? (
                    <>
                      <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">อัพโหลดแล้ว</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        คลิกเพื่ออัพโหลด
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {documents[1].status !== "APPROVED" && (
              <div className="mt-4 flex justify-end">
                <Button>{t("documents.upload")}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t("documents.selfie")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xs mx-auto">
              <div className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50">
                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  ถ่ายรูปหน้าตรงพร้อมถือบัตรประชาชน
                </p>
              </div>
              <Button className="w-full mt-4">{t("documents.upload")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
