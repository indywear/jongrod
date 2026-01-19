"use client"

import { useState, useEffect, use, useRef } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, Loader2, ImageIcon, Upload, X, Plus } from "lucide-react"
import { Link } from "@/i18n/navigation"
import Image from "next/image"

const features = [
  "GPS",
  "Bluetooth",
  "Backup Camera",
  "USB Port",
  "Air Conditioning",
  "Cruise Control",
  "Leather Seats",
  "Sunroof",
  "Android Auto",
  "Apple CarPlay",
]

interface Props {
  params: Promise<{ id: string }>
}

export default function EditCarPage({ params }: Props) {
  const { id } = use(params)
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [carImages, setCarImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [partnerId, setPartnerId] = useState<string>("")
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: 2024,
    licensePlate: "",
    category: "SEDAN",
    transmission: "AUTO",
    fuelType: "PETROL",
    seats: 5,
    doors: 4,
    pricePerDay: 1000,
    rentalStatus: "AVAILABLE",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setPartnerId(userData.partnerId || "av-carrent-official")
      } catch {
        setPartnerId("av-carrent-official")
      }
    }
    fetchCar()
  }, [id])

  const fetchCar = async () => {
    try {
      const response = await fetch(`/api/partner/cars/${id}`)
      const data = await response.json()

      if (data.car) {
        setFormData({
          brand: data.car.brand,
          model: data.car.model,
          year: data.car.year,
          licensePlate: data.car.licensePlate,
          category: data.car.category,
          transmission: data.car.transmission,
          fuelType: data.car.fuelType,
          seats: data.car.seats,
          doors: data.car.doors,
          pricePerDay: Number(data.car.pricePerDay),
          rentalStatus: data.car.rentalStatus,
        })
        setSelectedFeatures(data.car.features || [])
        setCarImages(data.car.images || [])
      }
    } catch (error) {
      console.error("Error fetching car:", error)
      setError("ไม่สามารถโหลดข้อมูลรถได้")
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    )
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImageFiles = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewImages((prev) => [...prev, ...newImageFiles])
  }

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const removeExistingImage = (index: number) => {
    setCarImages((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    if (newImages.length === 0) return []

    const uploadedUrls: string[] = []

    for (const { file } of newImages) {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("partnerId", partnerId)
      formDataUpload.append("carId", id)

      const response = await fetch("/api/partner/cars/upload-image", {
        method: "POST",
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          uploadedUrls.push(data.url)
        }
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      let allImages = [...carImages]

      if (newImages.length > 0) {
        setUploadingImages(true)
        const uploadedUrls = await uploadImages()
        allImages = [...allImages, ...uploadedUrls]
        setUploadingImages(false)
      }

      const response = await fetch(`/api/partner/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: selectedFeatures,
          images: allImages,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "เกิดข้อผิดพลาด")
        return
      }

      router.push("/partner/cars")
    } catch {
      setError("ไม่สามารถบันทึกได้")
    } finally {
      setIsLoading(false)
      setUploadingImages(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/partner/cars"
        className="inline-flex items-center text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        กลับ
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{t("partner.editCar")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>รูปภาพรถ</Label>
              <div className="grid grid-cols-4 gap-3">
                {carImages.map((image, index) => (
                  <div key={`existing-${index}`} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                    <Image
                      src={image}
                      alt={`รูปรถ ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {newImages.map((img, index) => (
                  <div key={`new-${index}`} className="relative aspect-video rounded-lg overflow-hidden bg-muted group border-2 border-primary">
                    <Image
                      src={img.preview}
                      alt={`รูปใหม่ ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs text-center py-0.5">
                      ใหม่
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="aspect-video rounded-lg border-2 border-dashed hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs mt-1">เพิ่มรูป</span>
                </button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              {carImages.length === 0 && newImages.length === 0 && (
                <p className="text-sm text-muted-foreground">คลิกปุ่ม + เพื่อเพิ่มรูปภาพรถ</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">{t("partner.carForm.brand")}</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">{t("partner.carForm.model")}</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">{t("partner.carForm.year")}</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">{t("partner.carForm.licensePlate")}</Label>
                <Input
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("partner.carForm.category")}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleSelectChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEDAN">ซีดาน</SelectItem>
                    <SelectItem value="SUV">เอสยูวี</SelectItem>
                    <SelectItem value="VAN">แวน</SelectItem>
                    <SelectItem value="PICKUP">กระบะ</SelectItem>
                    <SelectItem value="LUXURY">หรูหรา</SelectItem>
                    <SelectItem value="COMPACT">ขนาดเล็ก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.transmission")}</Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(v) => handleSelectChange("transmission", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">ออโต้</SelectItem>
                    <SelectItem value="MANUAL">ธรรมดา</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.fuelType")}</Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(v) => handleSelectChange("fuelType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PETROL">เบนซิน</SelectItem>
                    <SelectItem value="DIESEL">ดีเซล</SelectItem>
                    <SelectItem value="HYBRID">ไฮบริด</SelectItem>
                    <SelectItem value="EV">ไฟฟ้า</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seats">{t("partner.carForm.seats")}</Label>
                <Input
                  id="seats"
                  name="seats"
                  type="number"
                  value={formData.seats}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doors">{t("partner.carForm.doors")}</Label>
                <Input
                  id="doors"
                  name="doors"
                  type="number"
                  value={formData.doors}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerDay">{t("partner.carForm.pricePerDay")}</Label>
                <Input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>สถานะ</Label>
              <Select
                value={formData.rentalStatus}
                onValueChange={(v) => handleSelectChange("rentalStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">ว่าง</SelectItem>
                  <SelectItem value="RENTED">ถูกเช่า</SelectItem>
                  <SelectItem value="MAINTENANCE">ซ่อมบำรุง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("partner.carForm.features")}</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={selectedFeatures.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                    />
                    <label htmlFor={feature} className="text-sm cursor-pointer">
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Link href="/partner/cars">
                <Button type="button" variant="outline">
                  ยกเลิก
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
