"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Car, Calendar, MapPin, Eye, X, Loader2 } from "lucide-react"
import Image from "next/image"

interface BookingData {
  id: string
  bookingNumber: string
  car: {
    id: string
    brand: string
    model: string
    year: number
    image: string | null
  }
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string
  pickupLocation: string
  returnLocation: string
  totalPrice: number
  status: string
}

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export default function MyBookingsPage() {
  const t = useTranslations()
  const { user, isLoading: authLoading } = useAuth()
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchBookings()
      } else {
        setLoading(false)
      }
    }
  }, [authLoading, user, statusFilter])

  const fetchBookings = async () => {
    if (!user) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("userId", user.id)
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await fetch(`/api/customer/bookings?${params.toString()}`)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    setCancelling(true)
    try {
      const response = await fetch("/api/customer/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          status: "CANCELLED",
        }),
      })

      if (response.ok) {
        setShowCancelDialog(false)
        setSelectedBooking(null)
        fetchBookings()
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      NEW: { label: t("myBookings.status.NEW"), className: "bg-yellow-100 text-yellow-800" },
      CLAIMED: { label: t("myBookings.status.CLAIMED"), className: "bg-blue-100 text-blue-800" },
      PICKUP: { label: t("myBookings.status.PICKUP"), className: "bg-purple-100 text-purple-800" },
      ACTIVE: { label: t("myBookings.status.ACTIVE"), className: "bg-green-100 text-green-800" },
      RETURN: { label: t("myBookings.status.RETURN"), className: "bg-orange-100 text-orange-800" },
      COMPLETED: { label: t("myBookings.status.COMPLETED"), className: "bg-gray-100 text-gray-800" },
      CANCELLED: { label: t("myBookings.status.CANCELLED"), className: "bg-red-100 text-red-800" },
    }
    const config = statusConfig[status] || statusConfig.NEW
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="text-center py-12">
          <CardContent>
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">กรุณาเข้าสู่ระบบเพื่อดูการจองของคุณ</p>
            <Link href="/login">
              <Button>เข้าสู่ระบบ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("myBookings.title")}</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="NEW">{t("myBookings.status.NEW")}</SelectItem>
            <SelectItem value="ACTIVE">{t("myBookings.status.ACTIVE")}</SelectItem>
            <SelectItem value="COMPLETED">{t("myBookings.status.COMPLETED")}</SelectItem>
            <SelectItem value="CANCELLED">{t("myBookings.status.CANCELLED")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("common.noData")}</p>
            <Link href="/cars">
              <Button className="mt-4">ค้นหารถ</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-14 bg-muted rounded flex items-center justify-center overflow-hidden relative">
                      {booking.car.image ? (
                        <Image
                          src={booking.car.image}
                          alt={`${booking.car.brand} ${booking.car.model}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Car className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          {booking.bookingNumber}
                        </span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <h3 className="font-semibold">
                        {booking.car.brand} {booking.car.model} {booking.car.year}
                      </h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {booking.pickupDate} - {booking.returnDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {booking.pickupLocation}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xl font-bold text-primary">
                      {booking.totalPrice.toLocaleString()} THB
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        ดูรายละเอียด
                      </Button>
                      {booking.status === "NEW" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowCancelDialog(true)
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          ยกเลิก
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!selectedBooking && !showCancelDialog}
        onOpenChange={() => setSelectedBooking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รายละเอียดการจอง</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono">{selectedBooking.bookingNumber}</span>
                {getStatusBadge(selectedBooking.status)}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">
                  {selectedBooking.car.brand} {selectedBooking.car.model}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {selectedBooking.car.year}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">วันรับรถ</p>
                  <p className="font-medium">
                    {selectedBooking.pickupDate} {selectedBooking.pickupTime}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">วันคืนรถ</p>
                  <p className="font-medium">
                    {selectedBooking.returnDate} {selectedBooking.returnTime}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">สถานที่รับรถ</p>
                  <p className="font-medium">{selectedBooking.pickupLocation}</p>
                </div>
                {selectedBooking.returnLocation && selectedBooking.returnLocation !== selectedBooking.pickupLocation && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">สถานที่คืนรถ</p>
                    <p className="font-medium">{selectedBooking.returnLocation}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-between pt-4 border-t">
                <span className="font-medium">ราคารวม</span>
                <span className="text-xl font-bold text-primary">
                  {selectedBooking.totalPrice.toLocaleString()} THB
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิก</DialogTitle>
          </DialogHeader>
          <p>คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?</p>
          {selectedBooking && (
            <p className="text-muted-foreground">
              {selectedBooking.bookingNumber} -{" "}
              {selectedBooking.car.brand} {selectedBooking.car.model}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              ไม่
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              ยืนยันยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
