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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Coins, Check, Loader2 } from "lucide-react"

interface Commission {
  id: string
  partnerId: string
  bookingAmount: number
  commissionRate: number
  commissionAmount: number
  status: string
  createdAt: string
  partner: {
    id: string
    name: string
  }
  booking: {
    id: string
    bookingNumber: string
    customerName: string
  }
}

export default function CommissionsPage() {
  const t = useTranslations("admin")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchCommissions()
  }, [statusFilter])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      const response = await fetch(`/api/admin/commissions?${params.toString()}`)
      const data = await response.json()
      setCommissions(data.commissions || [])
      
      const pending = (data.commissions || [])
        .filter((c: Commission) => c.status === "PENDING")
        .reduce((sum: number, c: Commission) => sum + Number(c.commissionAmount), 0)
      setPendingTotal(pending)
    } catch (error) {
      console.error("Error fetching commissions:", error)
      setCommissions([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const pendingIds = commissions
      .filter((c) => c.status === "PENDING")
      .map((c) => c.id)
    setSelectedIds(pendingIds)
  }

  const markAsPaid = async () => {
    if (selectedIds.length === 0) return
    
    setProcessing(true)
    try {
      for (const id of selectedIds) {
        await fetch(`/api/admin/commissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAID" }),
        })
      }
      setSelectedIds([])
      fetchCommissions()
    } catch (error) {
      console.error("Error marking as paid:", error)
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
        <h1 className="text-3xl font-bold">{t("commissions")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยอดรวมที่ต้องจ่าย</p>
                <p className="text-3xl font-bold text-primary">
                  {pendingTotal.toLocaleString()} THB
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Coins className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="PENDING">รอจ่าย</SelectItem>
              <SelectItem value="PAID">จ่ายแล้ว</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={selectAll}>
            เลือกทั้งหมด
          </Button>
          <Button onClick={markAsPaid} disabled={selectedIds.length === 0 || processing}>
            {processing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Mark as Paid ({selectedIds.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mb-4" />
              <p>ไม่มีรายการ Commission</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Booking#</TableHead>
                  <TableHead>ยอดจอง</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell>
                      {comm.status === "PENDING" && (
                        <Checkbox
                          checked={selectedIds.includes(comm.id)}
                          onCheckedChange={() => toggleSelect(comm.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{comm.partner.name}</TableCell>
                    <TableCell className="font-mono">{comm.booking.bookingNumber}</TableCell>
                    <TableCell>{Number(comm.bookingAmount).toLocaleString()} THB</TableCell>
                    <TableCell>{Number(comm.commissionRate)}%</TableCell>
                    <TableCell className="font-bold">
                      {Number(comm.commissionAmount).toLocaleString()} THB
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          comm.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {comm.status === "PENDING" ? "รอจ่าย" : "จ่ายแล้ว"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(comm.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
