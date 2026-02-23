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
import { Car, Check, X, Eye, Loader2 } from "lucide-react"
import Image from "next/image"

interface CarData {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  category: string
  pricePerDay: number
  images: string[]
  createdAt: string
  partner: {
    id: string
    name: string
    phone: string
  }
}

export default function CarApprovalPage() {
  const t = useTranslations()
  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/cars/pending")
      const data = await response.json()
      setCars(data.cars || [])
    } catch (error) {
      console.error("Error fetching cars:", error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (carId: string) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/cars/${carId}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      })

      if (response.ok) {
        fetchCars()
        setShowPreviewDialog(false)
      }
    } catch (error) {
      console.error("Error approving car:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCar) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/cars/${selectedCar.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "REJECTED",
          reason: rejectReason,
        }),
      })

      if (response.ok) {
        setShowRejectDialog(false)
        setRejectReason("")
        fetchCars()
      }
    } catch (error) {
      console.error("Error rejecting car:", error)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("admin.carApproval")}</h1>
        <Badge variant="outline">{cars.length} รอตรวจสอบ</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {cars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Car className="h-12 w-12 mb-4" />
              <p>ไม่มีรถรอตรวจสอบ</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รถ</TableHead>
                  <TableHead>ทะเบียน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>ราคา/วัน</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>ส่งเมื่อ</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-muted rounded flex items-center justify-center overflow-hidden relative">
                          {car.images && car.images.length > 0 ? (
                            <Image
                              src={car.images[0] as string}
                              alt={`${car.brand} ${car.model}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Car className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-sm text-muted-foreground">{car.year}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{car.licensePlate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`cars.category.${car.category}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(car.pricePerDay).toLocaleString()} THB</TableCell>
                    <TableCell>{car.partner.name}</TableCell>
                    <TableCell>{formatDate(car.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedCar(car)
                            setShowPreviewDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(car.id)}
                          disabled={processing}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedCar(car)
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
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดรถ</DialogTitle>
          </DialogHeader>
          {selectedCar && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">รถ</p>
                  <p className="font-medium">
                    {selectedCar.brand} {selectedCar.model} {selectedCar.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ทะเบียน</p>
                  <p className="font-mono">{selectedCar.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Partner</p>
                  <p className="font-medium">{selectedCar.partner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ราคา/วัน</p>
                  <p className="font-bold text-primary">
                    {Number(selectedCar.pricePerDay).toLocaleString()} THB
                  </p>
                </div>
              </div>
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">รูปภาพ</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selectedCar.images as string[]).slice(0, 6).map((img, idx) => (
                      <div key={idx} className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        <Image
                          src={img}
                          alt={`Car ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              ปิด
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedCar) handleApprove(selectedCar.id)
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
            <DialogTitle>ปฏิเสธรถ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCar && (
              <p>
                {selectedCar.brand} {selectedCar.model} - {selectedCar.licensePlate}
              </p>
            )}
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
