"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Calendar, Shield, DollarSign, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

interface FeaturedCar {
  id: string
  brand: string
  model: string
  year: number
  category: string
  transmission: string
  pricePerDay: number
  images: string[]
}

export default function HomePage() {
  const t = useTranslations()
  const [featuredCars, setFeaturedCars] = useState<FeaturedCar[]>([])
  const [loading, setLoading] = useState(true)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  useEffect(() => {
    fetchFeaturedCars()
  }, [])

  const fetchFeaturedCars = async () => {
    try {
      const response = await fetch("/api/cars?limit=4")
      const data = await response.json()
      setFeaturedCars(data.cars || [])
      if (data.categories) {
        setAvailableCategories(data.categories)
      }
    } catch (error) {
      console.error("Error fetching cars:", error)
      setFeaturedCars([])
    } finally {
      setLoading(false)
    }
  }

  const categoryLabels: Record<string, string> = {
    SEDAN: t("cars.category.SEDAN"),
    SUV: t("cars.category.SUV"),
    VAN: t("cars.category.VAN"),
    PICKUP: t("cars.category.PICKUP"),
    LUXURY: t("cars.category.LUXURY"),
    COMPACT: t("cars.category.COMPACT"),
    MOTORCYCLE: t("cars.category.MOTORCYCLE"),
  }

  const categories = availableCategories.map(cat => ({
    value: cat,
    label: categoryLabels[cat] || cat,
  }))

  const usps = [
    {
      icon: Calendar,
      title: t("home.easyBooking"),
      description: t("home.easyBookingDesc"),
    },
    {
      icon: DollarSign,
      title: t("home.bestPrice"),
      description: t("home.bestPriceDesc"),
    },
    {
      icon: Shield,
      title: t("home.verified"),
      description: t("home.verifiedDesc"),
    },
  ]

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category] || category
  }

  const getTransmissionLabel = (transmission: string) => {
    return transmission === "AUTO" ? t("cars.transmission.AUTO") : t("cars.transmission.MANUAL")
  }

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground">
              {t("home.heroSubtitle")}
            </p>

            <Card className="mt-8 p-6">
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("home.pickupDate")}</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("home.returnDate")}</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("home.carType")}</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Link href="/cars" className="w-full">
                    <Button className="w-full" size="lg">
                      <Search className="mr-2 h-4 w-4" />
                      {t("common.search")}
                    </Button>
                  </Link>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("home.whyChooseUs")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {usps.map((usp, index) => (
              <Card key={index} className="text-center p-6">
                <CardContent className="pt-6 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <usp.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{usp.title}</h3>
                  <p className="text-muted-foreground">{usp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">{t("home.featuredCars")}</h2>
            <Link href="/cars">
              <Button variant="outline">{t("common.viewAll")}</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map((car) => (
                <Card key={car.id} className="overflow-hidden group">
                  <div className="aspect-video bg-muted relative">
                    {car.images && car.images.length > 0 && car.images[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <Image
                          src="/logo.png"
                          alt="Logo"
                          width={100}
                          height={33}
                          className="opacity-50"
                        />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold">{car.brand} {car.model} {car.year}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryLabel(car.category)} | {getTransmissionLabel(car.transmission)}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-primary">
                        {Number(car.pricePerDay).toLocaleString()} {t("cars.perDay")}
                      </span>
                      <Link href={`/cars/${car.id}`}>
                        <Button size="sm">{t("cars.bookNow")}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
