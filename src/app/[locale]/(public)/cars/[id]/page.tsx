"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Car,
  Users,
  DoorOpen,
  Fuel,
  Settings2,
  Calendar,
  MapPin,
  Phone,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import { use } from "react"

interface CarData {
  id: string
  brand: string
  model: string
  year: number
  licensePlate: string
  category: string
  transmission: string
  fuelType: string
  seats: number
  doors: number
  pricePerDay: number
  images: string[]
  features: string[]
  partner: {
    id: string
    name: string
    phone: string
    contactEmail?: string
  }
}

export default function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id } = use(params)
  const t = useTranslations()
  const router = useRouter()
  const [car, setCar] = useState<CarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchCar()
  }, [id])

  const fetchCar = async () => {
    try {
      const response = await fetch(`/api/cars/${id}`)
      const data = await response.json()
      if (data.car) {
        setCar(data.car)
      } else {
        router.push("/cars")
      }
    } catch (error) {
      console.error("Error fetching car:", error)
      router.push("/cars")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!car) {
    return null
  }

  const defaultFeatures = ["Air Conditioning", "Power Steering", "Central Locking"]
  const carFeatures = car.features && car.features.length > 0 ? car.features : defaultFeatures

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/cars"
        className="inline-flex items-center text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t("common.back")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
            {car.images && car.images.length > 0 && car.images[selectedImage] ? (
              <Image
                src={car.images[selectedImage]}
                alt={`${car.brand} ${car.model}`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="h-24 w-24 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {car.images && car.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {car.images.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-video bg-muted rounded-md relative overflow-hidden cursor-pointer hover:opacity-80 ${
                    selectedImage === i ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${car.brand} ${car.model} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("cars.specifications")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("cars.seats")}</p>
                    <p className="font-medium">{car.seats}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <DoorOpen className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("cars.doors")}</p>
                    <p className="font-medium">{car.doors}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("cars.filter.transmission")}
                    </p>
                    <p className="font-medium">
                      {t(`cars.transmission.${car.transmission}`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Fuel className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("cars.filter.fuelType")}
                    </p>
                    <p className="font-medium">{t(`cars.fuelType.${car.fuelType}`)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("cars.features")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {carFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Badge className="mb-2">{t(`cars.category.${car.category}`)}</Badge>
                <h1 className="text-2xl font-bold">
                  {car.brand} {car.model}
                </h1>
                <p className="text-muted-foreground">
                  {t("cars.year")} {car.year}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">
                    {Number(car.pricePerDay).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">{t("cars.perDay")}</span>
                </div>
              </div>

              <Link href={`/booking/${car.id}`} className="block">
                <Button className="w-full" size="lg">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("cars.bookNow")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("cars.partnerInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{car.partner.name}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
