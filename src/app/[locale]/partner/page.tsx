"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { Car, ClipboardList, TrendingUp, Plus, Eye, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardStats {
  totalCars: number
  availableCars: number
  pendingLeads: number
  monthRevenue: number
}

interface RecentLead {
  id: string
  bookingNumber: string
  car: { brand: string; model: string }
  status: string
}

export default function PartnerDashboard() {
  const t = useTranslations("partner")
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalCars: 0,
    availableCars: 0,
    pendingLeads: 0,
    monthRevenue: 0,
  })
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])

  useEffect(() => {
    if (!authLoading && user?.partnerId) {
      fetchDashboardData(user.partnerId)
    }
  }, [authLoading, user?.partnerId])

  const fetchDashboardData = async (partnerId: string) => {
    setLoading(true)
    try {

      const [carsResponse, leadsResponse] = await Promise.all([
        fetch(`/api/partner/cars?partnerId=${partnerId}`),
        fetch(`/api/partner/leads?partnerId=${partnerId}`),
      ])
      
      const carsData = await carsResponse.json()
      const leadsData = await leadsResponse.json()
      
      const cars = carsData.cars || []
      const leads = leadsData.leads || []

      const totalCars = cars.length
      const availableCars = cars.filter((car: { rentalStatus: string }) => car.rentalStatus === "AVAILABLE").length

      const pendingLeads = leads.filter((lead: { status: string }) => 
        lead.status === "NEW" || lead.status === "CLAIMED"
      ).length

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthRevenue = leads
        .filter((lead: { status: string; pickupDate: string }) => {
          const leadDate = new Date(lead.pickupDate)
          return (
            lead.status === "COMPLETED" &&
            leadDate.getMonth() === currentMonth &&
            leadDate.getFullYear() === currentYear
          )
        })
        .reduce((sum: number, lead: { totalPrice: number }) => sum + lead.totalPrice, 0)

      setStats({
        totalCars,
        availableCars,
        pendingLeads,
        monthRevenue,
      })

      setRecentLeads(leads.slice(0, 5).map((lead: { id: string; bookingNumber: string; car: { brand: string; model: string; year: number }; status: string }) => ({
        id: lead.id,
        bookingNumber: lead.bookingNumber,
        car: { brand: lead.car.brand, model: `${lead.car.model} ${lead.car.year}` },
        status: lead.status,
      })))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsDisplay = [
    {
      title: t("stats.totalCars"),
      value: stats.totalCars.toString(),
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: t("stats.availableCars"),
      value: stats.availableCars.toString(),
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("stats.pendingLeads"),
      value: stats.pendingLeads.toString(),
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: t("stats.monthRevenue"),
      value: stats.monthRevenue.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      suffix: " THB",
    },
  ]

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <Link href="/partner/cars/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("addCar")}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsDisplay.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">
                    {stat.value}
                    {stat.suffix}
                  </p>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leads ล่าสุด</CardTitle>
            <Link href="/partner/leads">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                ดูทั้งหมด
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>ยังไม่มี Lead ในขณะนี้</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{lead.bookingNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.car.brand} {lead.car.model}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การดำเนินการด่วน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/partner/cars" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Car className="h-4 w-4 mr-2" />
                จัดการรถทั้งหมด ({stats.totalCars} คัน)
              </Button>
            </Link>
            <Link href="/partner/cars/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรถใหม่
              </Button>
            </Link>
            <Link href="/partner/leads" className="block">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="h-4 w-4 mr-2" />
                ดู Leads ทั้งหมด
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
