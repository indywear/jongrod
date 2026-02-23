"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, MoreHorizontal, Pencil, Car, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"

interface CarData {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  pricePerDay: number
  approvalStatus: string
  rentalStatus: string
  images: string[]
}

export default function PartnerCarsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (user?.partnerId) {
      fetchCars()
    } else if (user !== undefined) {
      setLoading(false)
    }
  }, [user?.partnerId])

  const fetchCars = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/partner/cars?partnerId=${user?.partnerId}&limit=500`, {
        credentials: "include",
      })
      const data = await response.json()
      setCars(data.cars || [])
    } catch (error) {
      console.error("Error fetching cars:", error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (carId: string) => {
    if (!confirm("คุณต้องการลบรถคันนี้หรือไม่?")) return

    try {
      const response = await fetch(`/api/partner/cars/${carId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCars(cars.filter((car) => car.id !== carId))
      } else {
        alert("ไม่สามารถลบรถได้")
      }
    } catch (error) {
      console.error("Error deleting car:", error)
      alert("เกิดข้อผิดพลาด")
    }
  }

  const filteredCars = cars.filter((car) => {
    if (statusFilter === "all") return true
    return car.rentalStatus === statusFilter
  })

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">อนุมัติแล้ว</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">รออนุมัติ</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">ปฏิเสธ</Badge>
      default:
        return null
    }
  }

  const getRentalBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="outline" className="text-green-600">ว่าง</Badge>
      case "RENTED":
        return <Badge variant="outline" className="text-blue-600">ถูกเช่า</Badge>
      case "MAINTENANCE":
        return <Badge variant="outline" className="text-orange-600">ซ่อมบำรุง</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("partner.cars")}</h1>
        <Link href="/partner/cars/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("partner.addCar")}
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] sm:w-[180px]">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด ({cars.length})</SelectItem>
            <SelectItem value="AVAILABLE">ว่าง</SelectItem>
            <SelectItem value="RENTED">ถูกเช่า</SelectItem>
            <SelectItem value="MAINTENANCE">ซ่อมบำรุง</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">ไม่มีรถ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รถ</TableHead>
                  <TableHead>ทะเบียน</TableHead>
                  <TableHead>ราคา/วัน</TableHead>
                  <TableHead>สถานะอนุมัติ</TableHead>
                  <TableHead>สถานะเช่า</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                          {car.images && car.images.length > 0 ? (
                            <Image
                              src={car.images[0]}
                              alt={`${car.brand} ${car.model}`}
                              width={64}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Car className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {car.brand} {car.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {car.year}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{car.licensePlate}</TableCell>
                    <TableCell>{Number(car.pricePerDay).toLocaleString()} บาท</TableCell>
                    <TableCell>{getApprovalBadge(car.approvalStatus)}</TableCell>
                    <TableCell>{getRentalBadge(car.rentalStatus)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/partner/cars/${car.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              แก้ไข
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(car.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
