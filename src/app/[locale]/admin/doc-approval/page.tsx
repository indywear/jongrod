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
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileCheck, Check, X, Eye, User, Loader2 } from "lucide-react"
import Image from "next/image"

interface DocumentData {
  id: string
  type: string
  documentNumber: string
  frontImageUrl: string
  backImageUrl: string | null
  selfieUrl: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  }
}

export default function DocApprovalPage() {
  const t = useTranslations()
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/documents/pending")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "ID_CARD":
        return <Badge variant="outline">บัตรประชาชน</Badge>
      case "DRIVER_LICENSE":
        return <Badge variant="outline">ใบขับขี่</Badge>
      default:
        return null
    }
  }

  const handleApprove = async (docId: string) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/documents/${docId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      })

      if (response.ok) {
        fetchDocuments()
        setShowPreviewDialog(false)
      }
    } catch (error) {
      console.error("Error approving document:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedDoc) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/documents/${selectedDoc.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "REJECTED",
          rejectionReason: rejectReason,
        }),
      })

      if (response.ok) {
        setShowRejectDialog(false)
        setRejectReason("")
        fetchDocuments()
      }
    } catch (error) {
      console.error("Error rejecting document:", error)
    } finally {
      setProcessing(false)
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
        <h1 className="text-3xl font-bold">{t("admin.docApproval")}</h1>
        <Badge variant="outline">{documents.length} รอตรวจสอบ</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileCheck className="h-12 w-12 mb-4" />
              <p>ไม่มีเอกสารรอตรวจสอบ</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>ประเภทเอกสาร</TableHead>
                  <TableHead>เลขเอกสาร</TableHead>
                  <TableHead>ส่งเมื่อ</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {doc.user.firstName} {doc.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {doc.user.email || doc.user.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getDocTypeBadge(doc.type)}</TableCell>
                    <TableCell className="font-mono">{doc.documentNumber}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc)
                            setShowPreviewDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(doc.id)}
                          disabled={processing}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc)
                            setShowRejectDialog(true)
                          }}
                        >
                          <X className="h-4 w-4" />
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

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>ตรวจสอบเอกสาร</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ชื่อ</p>
                  <p className="font-medium">
                    {selectedDoc.user.firstName} {selectedDoc.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">เลขเอกสาร</p>
                  <p className="font-mono">{selectedDoc.documentNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ด้านหน้า</p>
                  <div className="aspect-[3/2] bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                    {selectedDoc.frontImageUrl ? (
                      <Image
                        src={selectedDoc.frontImageUrl}
                        alt="Front"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <FileCheck className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ด้านหลัง</p>
                  <div className="aspect-[3/2] bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                    {selectedDoc.backImageUrl ? (
                      <Image
                        src={selectedDoc.backImageUrl}
                        alt="Back"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <FileCheck className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Selfie</p>
                  <div className="aspect-[3/2] bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                    {selectedDoc.selfieUrl ? (
                      <Image
                        src={selectedDoc.selfieUrl}
                        alt="Selfie"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              ปิด
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedDoc) handleApprove(selectedDoc.id)
              }}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              อนุมัติ
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowPreviewDialog(false)
                setShowRejectDialog(true)
              }}
            >
              ปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปฏิเสธเอกสาร</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>เหตุผลในการปฏิเสธ</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="ระบุเหตุผล..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              ปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
