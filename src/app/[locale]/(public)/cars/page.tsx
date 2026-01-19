"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Car, Users, DoorOpen, Fuel, Settings2, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"

interface CarData {
  id: string
  brand: string
  model: string
  year: number
  category: string
  transmission: string
  fuelType: string
  seats: number
  doors: number
  pricePerDay: number
  images: string[]
  partner?: {
    id: string
    name: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function CarsPage() {
  const t = useTranslations()
  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>("")
  const [transmission, setTransmission] = useState<string>("")
  const [fuelType, setFuelType] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  useEffect(() => {
    fetchCars()
  }, [category, transmission, fuelType, sortBy, page])

  const fetchCars = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category && category !== "all") params.append("category", category)
      if (transmission && transmission !== "all") params.append("transmission", transmission)
      if (fuelType && fuelType !== "all") params.append("fuelType", fuelType)
      if (sortBy) params.append("sort", sortBy)
      params.append("page", page.toString())
      params.append("limit", "12")

      const response = await fetch(`/api/cars?${params.toString()}`)
      const data = await response.json()
      setCars(data.cars || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error("Error fetching cars:", error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: "SEDAN", label: t("cars.category.SEDAN") },
    { value: "SUV", label: t("cars.category.SUV") },
    { value: "VAN", label: t("cars.category.VAN") },
    { value: "PICKUP", label: t("cars.category.PICKUP") },
    { value: "LUXURY", label: t("cars.category.LUXURY") },
    { value: "COMPACT", label: t("cars.category.COMPACT") },
    { value: "MOTORCYCLE", label: t("cars.category.MOTORCYCLE") },
  ]

  const transmissions = [
    { value: "AUTO", label: t("cars.transmission.AUTO") },
    { value: "MANUAL", label: t("cars.transmission.MANUAL") },
  ]

  const fuelTypes = [
    { value: "PETROL", label: t("cars.fuelType.PETROL") },
    { value: "DIESEL", label: t("cars.fuelType.DIESEL") },
    { value: "HYBRID", label: t("cars.fuelType.HYBRID") },
    { value: "EV", label: t("cars.fuelType.EV") },
  ]

  const sortOptions = [
    { value: "newest", label: t("cars.sort.newest") },
    { value: "price_asc", label: t("cars.sort.price_asc") },
    { value: "price_desc", label: t("cars.sort.price_desc") },
  ]

  const getCategoryLabel = (cat: string) => {
    const found = categories.find(c => c.value === cat)
    return found ? found.label : cat
  }

  const handleFilterChange = () => {
    setPage(1)
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t("cars.filter.category")}</Label>
        <Select value={category} onValueChange={(v) => { setCategory(v); handleFilterChange(); }}>
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

      <div className="space-y-2">
        <Label>{t("cars.filter.transmission")}</Label>
        <Select value={transmission} onValueChange={(v) => { setTransmission(v); handleFilterChange(); }}>
          <SelectTrigger>
            <SelectValue placeholder={t("common.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {transmissions.map((trans) => (
              <SelectItem key={trans.value} value={trans.value}>
                {trans.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("cars.fuelType.PETROL")}</Label>
        <Select value={fuelType} onValueChange={(v) => { setFuelType(v); handleFilterChange(); }}>
          <SelectTrigger>
            <SelectValue placeholder={t("common.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {fuelTypes.map((fuel) => (
              <SelectItem key={fuel.value} value={fuel.value}>
                {fuel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("cars.filter.priceRange")}</Label>
        <div className="flex gap-2">
          <Input type="number" placeholder="Min" />
          <Input type="number" placeholder="Max" />
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setCategory("")
          setTransmission("")
          setFuelType("")
          setPage(1)
        }}
      >
        Clear Filters
      </Button>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("cars.title")}</h1>
          {pagination && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("common.showing")} {cars.length} {t("common.of")} {pagination.total} {t("common.items")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter className="h-4 w-4 mr-2" />
                {t("common.filter")}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>{t("common.filter")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("common.sort")} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="hidden md:block">
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold mb-4">{t("common.filter")}</h3>
            <FilterContent />
          </Card>
        </aside>

        <div className="md:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cars.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("common.noData")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <Card key={car.id} className="overflow-hidden group">
                    <div className="aspect-video bg-muted relative">
                      {car.images && car.images.length > 0 && car.images[0] ? (
                        <Image
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Car className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2">
                        {getCategoryLabel(car.category)}
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {car.brand} {car.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {car.year}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {car.seats}
                        </span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-4 w-4" />
                          {car.doors}
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings2 className="h-4 w-4" />
                          {t(`cars.transmission.${car.transmission}`)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Fuel className="h-4 w-4" />
                          {t(`cars.fuelType.${car.fuelType}`)}
                        </span>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-primary">
                            {Number(car.pricePerDay).toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            {t("cars.perDay")}
                          </span>
                        </div>
                        <Link href={`/cars/${car.id}`}>
                          <Button size="sm">{t("cars.bookNow")}</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground ml-2">
                    {t("common.page")} {page} / {pagination.totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
