"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
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
import { Car, Users, DoorOpen, Fuel, Settings2, Filter, Loader2, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
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

interface BrandInfo {
  name: string
  count: number
}

interface YearInfo {
  year: number
  count: number
}

export default function CarsPage() {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>(searchParams.get("category") || "")
  const [transmission, setTransmission] = useState<string>(searchParams.get("transmission") || "")
  const [fuelType, setFuelType] = useState<string>(searchParams.get("fuelType") || "")
  const [brand, setBrand] = useState<string>(searchParams.get("brand") || "")
  const [year, setYear] = useState<string>(searchParams.get("year") || "")
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "newest")
  const [minPrice, setMinPrice] = useState<string>(searchParams.get("minPrice") || "")
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get("maxPrice") || "")
  const [searchText, setSearchText] = useState<string>(searchParams.get("search") || "")
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableBrands, setAvailableBrands] = useState<BrandInfo[]>([])
  const [availableYears, setAvailableYears] = useState<YearInfo[]>([])

  const [activeSearch, setActiveSearch] = useState<string>(searchParams.get("search") || "")

  // Autocomplete dropdown
  const [suggestions, setSuggestions] = useState<CarData[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch suggestions as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (searchText.trim().length < 1) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await fetch(`/api/cars?search=${encodeURIComponent(searchText.trim())}&limit=6`)
        const data = await res.json()
        setSuggestions(data.cars || [])
        setShowDropdown(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoadingSuggestions(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchText])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchCars = useCallback(async () => {
    setLoading(true)
    try {
      const urlParams = new URLSearchParams()
      if (category && category !== "all") urlParams.set("category", category)
      if (transmission && transmission !== "all") urlParams.set("transmission", transmission)
      if (fuelType && fuelType !== "all") urlParams.set("fuelType", fuelType)
      if (brand && brand !== "all") urlParams.set("brand", brand)
      if (year && year !== "all") urlParams.set("year", year)
      if (sortBy && sortBy !== "newest") urlParams.set("sort", sortBy)
      if (minPrice) urlParams.set("minPrice", minPrice)
      if (maxPrice) urlParams.set("maxPrice", maxPrice)
      if (activeSearch.trim()) urlParams.set("search", activeSearch.trim())
      if (page > 1) urlParams.set("page", page.toString())

      const qs = urlParams.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })

      const apiParams = new URLSearchParams(urlParams)
      if (sortBy) apiParams.set("sort", sortBy)
      apiParams.set("page", page.toString())
      apiParams.set("limit", "12")

      const response = await fetch(`/api/cars?${apiParams.toString()}`)
      const data = await response.json()
      setCars(data.cars || [])
      setPagination(data.pagination || null)
      if (data.categories) setAvailableCategories(data.categories)
      if (data.brands) setAvailableBrands(data.brands)
      if (data.years) setAvailableYears(data.years)
    } catch (error) {
      console.error("Error fetching cars:", error)
      setCars([])
    } finally {
      setLoading(false)
    }
  }, [category, transmission, fuelType, brand, year, sortBy, minPrice, maxPrice, activeSearch, page, router, pathname])

  useEffect(() => {
    fetchCars()
  }, [fetchCars])

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

  const getCategoryLabel = (cat: string) => categoryLabels[cat] || cat

  const fuelTypeLabels: Record<string, string> = {
    PETROL: t("cars.fuelType.PETROL"),
    DIESEL: t("cars.fuelType.DIESEL"),
    HYBRID: t("cars.fuelType.HYBRID"),
    EV: t("cars.fuelType.EV"),
  }

  const transmissionLabels: Record<string, string> = {
    AUTO: t("cars.transmission.AUTO"),
    MANUAL: t("cars.transmission.MANUAL"),
  }

  const handleFilterChange = () => {
    setPage(1)
  }

  const handleSearch = () => {
    setActiveSearch(searchText.trim())
    setPage(1)
  }

  const clearAllFilters = () => {
    setCategory("")
    setTransmission("")
    setFuelType("")
    setBrand("")
    setYear("")
    setMinPrice("")
    setMaxPrice("")
    setSearchText("")
    setActiveSearch("")
    setPage(1)
  }

  // Count active filters
  const activeFilters: { label: string; onClear: () => void }[] = []
  if (category && category !== "all") {
    activeFilters.push({ label: `${t("cars.filter.category")}: ${getCategoryLabel(category)}`, onClear: () => { setCategory(""); handleFilterChange() } })
  }
  if (brand && brand !== "all") {
    activeFilters.push({ label: `${t("cars.filter.brand")}: ${brand}`, onClear: () => { setBrand(""); handleFilterChange() } })
  }
  if (transmission && transmission !== "all") {
    activeFilters.push({ label: `${t("cars.filter.transmission")}: ${transmissionLabels[transmission] || transmission}`, onClear: () => { setTransmission(""); handleFilterChange() } })
  }
  if (fuelType && fuelType !== "all") {
    activeFilters.push({ label: `${t("cars.filter.fuelType")}: ${fuelTypeLabels[fuelType] || fuelType}`, onClear: () => { setFuelType(""); handleFilterChange() } })
  }
  if (year && year !== "all") {
    activeFilters.push({ label: `${t("cars.year")}: ${year}`, onClear: () => { setYear(""); handleFilterChange() } })
  }
  if (minPrice) {
    activeFilters.push({ label: `${t("cars.filter.minPrice")}: ${Number(minPrice).toLocaleString()}`, onClear: () => { setMinPrice(""); handleFilterChange() } })
  }
  if (maxPrice) {
    activeFilters.push({ label: `${t("cars.filter.maxPrice")}: ${Number(maxPrice).toLocaleString()}`, onClear: () => { setMaxPrice(""); handleFilterChange() } })
  }
  if (activeSearch) {
    activeFilters.push({ label: `"${activeSearch}"`, onClear: () => { setSearchText(""); setActiveSearch(""); handleFilterChange() } })
  }

  const FilterContent = () => (
    <div className="space-y-5">
      {/* Brand */}
      <div className="space-y-2">
        <Label>{t("cars.filter.brand")}</Label>
        <Select value={brand} onValueChange={(v) => { setBrand(v); handleFilterChange(); }}>
          <SelectTrigger>
            <SelectValue placeholder={t("common.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {availableBrands.map((b) => (
              <SelectItem key={b.name} value={b.name}>
                {b.name} ({b.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
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

      {/* Year */}
      <div className="space-y-2">
        <Label>{t("cars.year")}</Label>
        <Select value={year} onValueChange={(v) => { setYear(v); handleFilterChange(); }}>
          <SelectTrigger>
            <SelectValue placeholder={t("common.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {availableYears.map((y) => (
              <SelectItem key={y.year} value={y.year.toString()}>
                {y.year} ({y.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
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

      {/* Fuel Type */}
      <div className="space-y-2">
        <Label>{t("cars.filter.fuelType")}</Label>
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

      {/* Price Range */}
      <div className="space-y-2">
        <Label>{t("cars.filter.priceRange")}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t("cars.filter.minPrice")}
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); handleFilterChange(); }}
          />
          <Input
            type="number"
            placeholder={t("cars.filter.maxPrice")}
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); handleFilterChange(); }}
          />
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={clearAllFilters}
      >
        {t("cars.filter.clearFilters")}
      </Button>
    </div>
  )

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/90 to-primary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {t("home.heroTitle")}
          </h1>
          <p className="text-white/80 mb-8 text-lg">
            {t("home.heroSubtitle")}
          </p>
          <div className="max-w-2xl mx-auto relative" ref={searchContainerRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder={t("home.searchPlaceholder")}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setShowDropdown(false)
                      handleSearch()
                    }
                    if (e.key === "Escape") setShowDropdown(false)
                  }}
                  onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
                  className="bg-white text-foreground h-12 text-base pl-11"
                />
                {searchText && (
                  <button
                    onClick={() => { setSearchText(""); setSuggestions([]); setShowDropdown(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button size="lg" variant="secondary" onClick={() => { setShowDropdown(false); handleSearch() }} className="h-12 px-6">
                <Search className="h-5 w-5 mr-2" />
                {t("common.search")}
              </Button>
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[480px] overflow-y-auto">
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">{t("common.loading")}...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="py-8 text-center">
                    <Car className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
                  </div>
                ) : (
                  <>
                    {suggestions.map((car) => (
                      <Link
                        key={car.id}
                        href={`/cars/${car.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group"
                      >
                        {/* Car thumbnail */}
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          {car.images && car.images.length > 0 && car.images[0] ? (
                            <Image
                              src={car.images[0]}
                              alt={`${car.brand} ${car.model}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              unoptimized
                              onError={(e) => { e.currentTarget.style.display = "none" }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Car className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Car info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {car.brand} {car.model}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{car.year}</span>
                            <span className="text-gray-300">|</span>
                            <span>{t(`cars.fuelType.${car.fuelType}`)}</span>
                            <span className="text-gray-300">|</span>
                            <span>{t(`cars.transmission.${car.transmission}`)}</span>
                          </div>
                        </div>

                        {/* Price + Category */}
                        <div className="flex-shrink-0 text-right">
                          <p className="font-bold text-primary text-lg">
                            {Number(car.pricePerDay).toLocaleString()}
                          </p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {getCategoryLabel(car.category)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                    {/* View all results button */}
                    <button
                      onClick={() => { setShowDropdown(false); handleSearch() }}
                      className="w-full py-3 text-center text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t"
                    >
                      {t("common.search")} &quot;{searchText}&quot; →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Category Pills */}
      {categories.length > 0 && (
        <div className="container mx-auto px-4 pt-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={!category || category === "all" ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => { setCategory(""); handleFilterChange() }}
            >
              {t("common.all")}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => { setCategory(cat.value); handleFilterChange() }}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilters.map((filter, i) => (
              <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-1.5">
                {filter.label}
                <button onClick={filter.onClear} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {activeFilters.length > 1 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground text-xs">
                {t("cars.filter.clearFilters")}
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{t("cars.title")}</h2>
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
                  {activeFilters.length > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                      {activeFilters.length}
                    </Badge>
                  )}
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
                <p className="text-muted-foreground mb-4">{t("common.noData")}</p>
                {activeFilters.length > 0 && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    {t("cars.filter.clearFilters")}
                  </Button>
                )}
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
                              width={160}
                              height={54}
                              className="opacity-50"
                            />
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
    </div>
  )
}
