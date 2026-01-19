"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Car, FileCheck, Coins, ClipboardList, TrendingUp, Loader2 } from "lucide-react"

interface DashboardStats {
  totalPartners: number
  activePartners: number
  pendingCars: number
  pendingDocuments: number
  monthlyCommission: number
  totalBookings: number
}

interface RecentActivity {
  type: string
  text: string
  time: string
}

export default function AdminDashboard() {
  const t = useTranslations("admin")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalPartners: 0,
    activePartners: 0,
    pendingCars: 0,
    pendingDocuments: 0,
    monthlyCommission: 0,
    totalBookings: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [partnersRes, carsRes, docsRes, bookingsRes] = await Promise.all([
        fetch("/api/admin/partners"),
        fetch("/api/admin/cars?status=PENDING"),
        fetch("/api/admin/documents/pending"),
        fetch("/api/admin/bookings/recent"),
      ])

      const partnersData = await partnersRes.json()
      const carsData = await carsRes.json()
      const docsData = await docsRes.json()
      const bookingsData = await bookingsRes.json()

      const partners = partnersData.partners || []
      const pendingCars = carsData.cars || []
      const pendingDocs = docsData.documents || []
      const recentBookings = bookingsData.bookings || []

      setStats({
        totalPartners: partners.length,
        activePartners: partners.filter((p: { status: string }) => p.status === "ACTIVE").length,
        pendingCars: pendingCars.length,
        pendingDocuments: pendingDocs.length,
        monthlyCommission: 0,
        totalBookings: recentBookings.length,
      })

      const activities: RecentActivity[] = []
      
      recentBookings.slice(0, 4).forEach((booking: { bookingNumber: string; createdAt: string }) => {
        const timeDiff = Date.now() - new Date(booking.createdAt).getTime()
        const minutes = Math.floor(timeDiff / 60000)
        let timeText = ""
        if (minutes < 60) {
          timeText = `${minutes} นาทีที่แล้ว`
        } else if (minutes < 1440) {
          timeText = `${Math.floor(minutes / 60)} ชั่วโมงที่แล้ว`
        } else {
          timeText = `${Math.floor(minutes / 1440)} วันที่แล้ว`
        }
        activities.push({
          type: "booking",
          text: `การจองใหม่: ${booking.bookingNumber}`,
          time: timeText,
        })
      })

      setRecentActivities(activities)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsDisplay = [
    {
      title: "Partners ทั้งหมด",
      value: stats.totalPartners.toString(),
      subValue: `${stats.activePartners} Active`,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "รถรออนุมัติ",
      value: stats.pendingCars.toString(),
      icon: Car,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "เอกสารรออนุมัติ",
      value: stats.pendingDocuments.toString(),
      icon: FileCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Bookings วันนี้",
      value: stats.totalBookings.toString(),
      icon: Coins,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t("dashboard")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">
                    {stat.value}
                  </p>
                  {stat.subValue && (
                    <p className="text-sm text-muted-foreground">{stat.subValue}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              สรุปข้อมูล
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm">Partners ที่ใช้งาน</span>
                <span className="font-bold text-blue-600">{stats.activePartners} / {stats.totalPartners}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm">รถรออนุมัติ</span>
                <span className="font-bold text-orange-600">{stats.pendingCars} คัน</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm">เอกสารรอตรวจสอบ</span>
                <span className="font-bold text-purple-600">{stats.pendingDocuments} รายการ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              กิจกรรมล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">ยังไม่มีกิจกรรมล่าสุด</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <p className="text-sm">{activity.text}</p>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
