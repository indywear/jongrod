"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useAuth } from "@/contexts/AuthContext"
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
import { ChevronLeft, Upload, X } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { toast } from "sonner"

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

export default function NewCarPage() {
  const t = useTranslations()
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    category: "",
    transmission: "",
    fuelType: "",
    seats: 5,
    doors: 4,
    pricePerDay: 0,
  })

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)

        const res = await fetch("/api/partner/cars/upload-image", {
          method: "POST",
          credentials: "include",
          body: formDataUpload,
        })

        if (res.ok) {
          const data = await res.json()
          setImageUrls((prev) => [...prev, data.url])
        } else {
          const data = await res.json()
          toast.error(data.error || "Failed to upload image")
        }
      }
    } catch {
      toast.error("Failed to upload images")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/partner/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          features: selectedFeatures,
          images: imageUrls,
          partnerId: user?.partnerId,
        }),
      })

      if (res.ok) {
        toast.success("เพิ่มรถสำเร็จ!")
        router.push("/partner/cars")
      } else {
        const data = await res.json()
        toast.error(data.error || "ไม่สามารถเพิ่มรถได้")
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/partner/cars"
        className="inline-flex items-center text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t("common.back")}
      </Link>

      <h1 className="text-3xl font-bold">{t("partner.addCar")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลรถ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("partner.carForm.brand")}</Label>
                <Input
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="เช่น Toyota"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.model")}</Label>
                <Input
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="เช่น Camry"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.year")}</Label>
                <Input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.licensePlate")}</Label>
                <Input
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="เช่น กข 1234"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("partner.carForm.category")}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => handleSelectChange("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEDAN">{t("cars.category.SEDAN")}</SelectItem>
                    <SelectItem value="SUV">{t("cars.category.SUV")}</SelectItem>
                    <SelectItem value="VAN">{t("cars.category.VAN")}</SelectItem>
                    <SelectItem value="PICKUP">{t("cars.category.PICKUP")}</SelectItem>
                    <SelectItem value="LUXURY">{t("cars.category.LUXURY")}</SelectItem>
                    <SelectItem value="COMPACT">{t("cars.category.COMPACT")}</SelectItem>
                    <SelectItem value="MOTORCYCLE">{t("cars.category.MOTORCYCLE")}</SelectItem>
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
                    <SelectValue placeholder="เลือกเกียร์" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">{t("cars.transmission.AUTO")}</SelectItem>
                    <SelectItem value="MANUAL">{t("cars.transmission.MANUAL")}</SelectItem>
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
                    <SelectValue placeholder="เลือกเชื้อเพลิง" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PETROL">{t("cars.fuelType.PETROL")}</SelectItem>
                    <SelectItem value="DIESEL">{t("cars.fuelType.DIESEL")}</SelectItem>
                    <SelectItem value="HYBRID">{t("cars.fuelType.HYBRID")}</SelectItem>
                    <SelectItem value="EV">{t("cars.fuelType.EV")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("partner.carForm.seats")}</Label>
                <Input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleInputChange}
                  min={1}
                  max={20}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.doors")}</Label>
                <Input
                  type="number"
                  name="doors"
                  value={formData.doors}
                  onChange={handleInputChange}
                  min={2}
                  max={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partner.carForm.pricePerDay")} (THB)</Label>
                <Input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  min={0}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("partner.carForm.features")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("partner.carForm.images")}</CardTitle>
          </CardHeader>
          <CardContent>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Car image ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {isUploading ? "กำลังอัพโหลด..." : "ลากไฟล์มาวางหรือคลิกเพื่ออัพโหลด"}
              </p>
              <p className="text-sm text-muted-foreground">
                รองรับ JPG, PNG ขนาดไม่เกิน 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/partner/cars">
            <Button type="button" variant="outline">
              {t("common.cancel")}
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "กำลังบันทึก..." : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
