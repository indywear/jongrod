"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Building2, Loader2, Eye, Edit } from "lucide-react"

interface Partner {
  id: string
  name: string
  contactEmail: string
  phone: string
  commissionRate: number
  status: string
  _count: { cars: number }
}

export default function AdminPartnersPage() {
  const t = useTranslations("admin")
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/partners")
      const data = await response.json()
      setPartners(data.partners || [])
    } catch (error) {
      console.error("Error fetching partners:", error)
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800">ใช้งาน</Badge>
      case "SUSPENDED":
        return <Badge className="bg-red-100 text-red-800">ระงับ</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">รอตรวจสอบ</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("partners")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพาร์ทเนอร์ทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ยังไม่มีพาร์ทเนอร์</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อร้าน</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>โทรศัพท์</TableHead>
                  <TableHead>ค่าคอมมิชชั่น</TableHead>
                  <TableHead>จำนวนรถ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.contactEmail}</TableCell>
                    <TableCell>{partner.phone}</TableCell>
                    <TableCell>{partner.commissionRate}%</TableCell>
                    <TableCell>{partner._count?.cars || 0} คัน</TableCell>
                    <TableCell>{getStatusBadge(partner.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
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
    </div>
  )
}
