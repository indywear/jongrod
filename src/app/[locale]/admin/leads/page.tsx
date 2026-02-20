"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Search, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react"

interface Booking {
  id: string
  bookingNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  car: { brand: string; model: string; year: number; licensePlate: string }
  partner: { name: string }
  pickupDatetime: string
  returnDatetime: string
  totalPrice: number
  leadStatus: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "NEW", label: "รอดำเนินการ" },
  { value: "CLAIMED", label: "กำลังดำเนินการ" },
  { value: "PICKUP", label: "รอรับรถ" },
  { value: "ACTIVE", label: "กำลังใช้งาน" },
  { value: "RETURN", label: "รอคืนรถ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
] as const

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  NEW: { label: "รอดำเนินการ", className: "bg-yellow-100 text-yellow-800" },
  CLAIMED: { label: "กำลังดำเนินการ", className: "bg-blue-100 text-blue-800" },
  PICKUP: { label: "รอรับรถ", className: "bg-purple-100 text-purple-800" },
  ACTIVE: { label: "กำลังใช้งาน", className: "bg-sky-100 text-sky-800" },
  RETURN: { label: "รอคืนรถ", className: "bg-orange-100 text-orange-800" },
  COMPLETED: { label: "เสร็จสิ้น", className: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ยกเลิก", className: "bg-red-100 text-red-800" },
}

export default function AdminLeadsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (search.trim()) params.append("search", search.trim())
      params.append("page", String(page))
      params.append("limit", "20")

      const response = await fetch(`/api/admin/leads?${params.toString()}`)
      const data = await response.json()
      setBookings(data.bookings || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error("Error fetching leads:", error)
      setBookings([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, search])

  const handleSearch = () => {
    setSearch(searchInput)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">รายการจองทั้งหมด</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            placeholder="ค้นหาชื่อ, เบอร์โทร, เลขที่จอง..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            รายการจอง
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                (ทั้งหมด {pagination.total.toLocaleString()} รายการ)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ไม่พบรายการจอง</p>
              <p className="text-sm text-muted-foreground mt-2">
                ลองเปลี่ยนตัวกรองหรือคำค้นหา
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่จอง</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>รถ</TableHead>
                    <TableHead>พาร์ทเนอร์</TableHead>
                    <TableHead>วันรับรถ</TableHead>
                    <TableHead>วันคืนรถ</TableHead>
                    <TableHead className="text-right">ราคารวม</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => {
                    const status = STATUS_MAP[b.leadStatus] || STATUS_MAP.NEW
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-sm">
                          {b.bookingNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{b.customerName}</p>
                            <p className="text-sm text-muted-foreground">{b.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{b.car.brand} {b.car.model}</TableCell>
                        <TableCell>{b.partner?.name || "-"}</TableCell>
                        <TableCell>{new Date(b.pickupDatetime).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell>{new Date(b.returnDatetime).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(b.totalPrice).toLocaleString()} ฿
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                หน้า {pagination.page} จาก {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  ถัดไป
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
