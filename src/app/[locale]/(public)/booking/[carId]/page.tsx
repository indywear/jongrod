"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Car, ChevronLeft, Check, Calendar, User, Phone, Mail, Loader2, MapPin, Upload, FileCheck, X, AlertCircle } from "lucide-react"
import Image from "next/image"
import { use } from "react"
import { ThaiDateTimePicker } from "@/components/booking/ThaiDateTimePicker"

interface PartnerData {
  id: string
  name: string
  phone: string
  contactEmail: string
  pickupLocations: string[]
  minAdvanceHours: number
}

interface CarData {
  id: string
  brand: string
  model: string
  year: number
  category: string
  pricePerDay: number
  images: string[]
  partner: PartnerData
}

type BookingStep = 1 | 2 | 3 | 4 | 5

interface UploadedFile {
  file: File
  preview: string
}

const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]

export default function BookingPage({
  params,
}: {
  params: Promise<{ carId: string }>
}) {
  const { carId } = use(params)
  const t = useTranslations()
  const router = useRouter()
  const [car, setCar] = useState<CarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pickupLocations, setPickupLocations] = useState<string[]>([])

  const [step, setStep] = useState<BookingStep>(1)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    pickupDate: "",
    pickupTime: "10:00",
    returnDate: "",
    returnTime: "10:00",
    pickupLocation: "",
    returnLocation: "",
    name: "",
    email: "",
    phone: "",
    note: "",
  })
  const [bookingNumber, setBookingNumber] = useState("")
  const [bookingId, setBookingId] = useState("")
  
  const [idCardFront, setIdCardFront] = useState<UploadedFile | null>(null)
  const [driverLicense, setDriverLicense] = useState<UploadedFile | null>(null)
  const [uploadingDocs, setUploadingDocs] = useState(false)

  const idCardFrontRef = useRef<HTMLInputElement>(null)
  const driverLicenseRef = useRef<HTMLInputElement>(null)

  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const [isLockedByOther, setIsLockedByOther] = useState(false)
  const [lockMessage, setLockMessage] = useState("")
  const lockIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const acquireLock = async () => {
    try {
      const response = await fetch(`/api/cars/${carId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      
      const data = await response.json()
      
      if (response.status === 409 && data.lockedByOther) {
        setIsLockedByOther(true)
        setLockMessage(data.message)
        return false
      }
      
      setIsLockedByOther(false)
      setLockMessage("")
      return true
    } catch (err) {
      console.error("Error acquiring lock:", err)
      return false
    }
  }

  const releaseLock = async () => {
    try {
      await fetch(`/api/cars/${carId}/lock?sessionId=${sessionId}`, {
        method: "DELETE",
      })
    } catch (err) {
      console.error("Error releasing lock:", err)
    }
  }

  useEffect(() => {
    fetchCar()
    
    acquireLock()

    lockIntervalRef.current = setInterval(() => {
      if (step < 5) {
        acquireLock()
      }
    }, 30000)

    return () => {
      if (lockIntervalRef.current) {
        clearInterval(lockIntervalRef.current)
      }
      if (step < 5) {
        releaseLock()
      }
    }
  }, [carId])

  const fetchCar = async () => {
    try {
      const response = await fetch(`/api/cars/${carId}`)
      const data = await response.json()
      if (data.car) {
        setCar(data.car)
        const locations = Array.isArray(data.car.partner?.pickupLocations)
          ? data.car.partner.pickupLocations
          : []
        setPickupLocations(locations)
        if (locations.length > 0) {
          setFormData(prev => ({
            ...prev,
            pickupLocation: locations[0],
            returnLocation: locations[0],
          }))
        }
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getMinPickupDate = () => {
    const minHours = car?.partner?.minAdvanceHours || 24
    const now = new Date()
    now.setHours(now.getHours() + minHours)
    return now.toISOString().split("T")[0]
  }

  const calculateDays = () => {
    if (!formData.pickupDate || !formData.returnDate) return 0
    const pickup = new Date(formData.pickupDate)
    const returnD = new Date(formData.returnDate)
    const diff = returnD.getTime() - pickup.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const totalPrice = car ? calculateDays() * Number(car.pricePerDay) : 0

  const formatThaiDateShort = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = THAI_MONTHS_SHORT[date.getMonth()]
    const year = (date.getFullYear() + 543).toString().slice(-2)
    return `${day} ${month} ${year}`
  }

  const handleSubmit = async () => {
    if (!car) return
    setSubmitting(true)
    setError("")
    
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          pickupDatetime: `${formData.pickupDate}T${formData.pickupTime}:00`,
          returnDatetime: `${formData.returnDate}T${formData.returnTime}:00`,
          pickupLocation: formData.pickupLocation,
          returnLocation: formData.returnLocation,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerNote: formData.note,
          totalPrice,
        }),
      })

      const data = await response.json()
      
      if (response.ok && data.bookingNumber) {
        setBookingNumber(data.bookingNumber)
        setBookingId(data.booking.id)
        setStep(4)
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง")
      }
    } catch (err) {
      console.error("Error creating booking:", err)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<UploadedFile | null>>
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("ไฟล์มีขนาดใหญ่เกิน 10MB")
        return
      }
      const preview = URL.createObjectURL(file)
      setFile({ file, preview })
      setError("")
    }
  }

  const handleUploadDocuments = async () => {
    if (!idCardFront || !driverLicense) {
      setError("กรุณาอัปโหลดรูปบัตรประชาชนด้านหน้าและใบขับขี่")
      return
    }

    setUploadingDocs(true)
    setError("")

    try {
      const formDataUpload = new FormData()
      formDataUpload.append("bookingId", bookingId)
      formDataUpload.append("customerName", formData.name)
      formDataUpload.append("idCardFront", idCardFront.file)
      formDataUpload.append("driverLicense", driverLicense.file)

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formDataUpload,
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStep(5)
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการอัปโหลดเอกสาร")
      }
    } catch (err) {
      console.error("Error uploading documents:", err)
      setError("เกิดข้อผิดพลาดในการอัปโหลดเอกสาร กรุณาลองใหม่")
    } finally {
      setUploadingDocs(false)
    }
  }

  const steps = [
    { num: 1, label: t("booking.step1") },
    { num: 2, label: t("booking.step2") },
    { num: 3, label: t("booking.step3") },
    { num: 4, label: "อัปโหลดเอกสาร" },
    { num: 5, label: t("booking.step4") },
  ]

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

  if (isLockedByOther) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/cars"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("common.back")}
        </Link>

        <Card className="text-center">
          <CardContent className="pt-12 pb-12 space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-600">
                รถกำลังถูกจองอยู่
              </h2>
              <p className="text-muted-foreground mt-2">
                {lockMessage}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => acquireLock()} variant="outline">
                ลองอีกครั้ง
              </Button>
              <Link href="/cars">
                <Button className="w-full">เลือกรถคันอื่น</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href={`/cars/${car.id}`}
        className="inline-flex items-center text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {t("common.back")}
      </Link>

      <h1 className="text-3xl font-bold mb-8">{t("booking.title")}</h1>

      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s.num
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {step > s.num ? <Check className="h-5 w-5" /> : s.num}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                step >= s.num ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-2 ${
                  step > s.num ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("booking.step1")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>{t("booking.pickupDateTime")}</Label>
                    <ThaiDateTimePicker
                      value={formData.pickupDate}
                      timeValue={formData.pickupTime}
                      onDateChange={(date) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          pickupDate: date,
                          returnDate: prev.returnDate && prev.returnDate < date ? date : prev.returnDate
                        }))
                      }}
                      onTimeChange={(time) => setFormData(prev => ({ ...prev, pickupTime: time }))}
                      minDate={getMinPickupDate()}
                      placeholder="เลือกวันรับรถ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("booking.returnDateTime")}</Label>
                    <ThaiDateTimePicker
                      value={formData.returnDate}
                      timeValue={formData.returnTime}
                      onDateChange={(date) => setFormData(prev => ({ ...prev, returnDate: date }))}
                      onTimeChange={(time) => setFormData(prev => ({ ...prev, returnTime: time }))}
                      minDate={formData.pickupDate || getMinPickupDate()}
                      placeholder="เลือกวันคืนรถ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("booking.pickupLocation")}
                    </Label>
                    {pickupLocations.length > 0 ? (
                      <Select
                        value={formData.pickupLocation}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, pickupLocation: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานที่รับรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupLocations.map((location, index) => (
                            <SelectItem key={index} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                        ร้านยังไม่ได้กำหนดสถานที่รับ-คืนรถ
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t("booking.returnLocation")}
                    </Label>
                    {pickupLocations.length > 0 ? (
                      <Select
                        value={formData.returnLocation}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, returnLocation: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกสถานที่คืนรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupLocations.map((location, index) => (
                            <SelectItem key={index} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700">
                        กรุณาติดต่อร้านเช่ารถ
                      </div>
                    )}
                  </div>
                </div>

                {car.partner?.minAdvanceHours && (
                  <p className="text-sm text-muted-foreground">
                    * ต้องจองล่วงหน้าอย่างน้อย {car.partner.minAdvanceHours} ชั่วโมง
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.pickupDate || !formData.returnDate || !formData.pickupLocation || pickupLocations.length === 0}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("booking.customerInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t("booking.name")}</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("booking.email")}</Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("booking.phone")}</Label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="08x-xxx-xxxx"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("booking.note")}</Label>
                  <Textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    {t("common.previous")}
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!formData.name || !formData.phone}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("booking.summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <div className="w-20 h-14 bg-muted-foreground/20 rounded flex items-center justify-center relative overflow-hidden">
                      {car.images && car.images[0] ? (
                        <Image
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Car className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">{car.year}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {t("booking.pickupDateTime")}
                      </p>
                      <p className="font-medium">
                        {formatThaiDateShort(formData.pickupDate)} {formData.pickupTime} น.
                      </p>
                      <p className="text-sm mt-1">{formData.pickupLocation}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {t("booking.returnDateTime")}
                      </p>
                      <p className="font-medium">
                        {formatThaiDateShort(formData.returnDate)} {formData.returnTime} น.
                      </p>
                      <p className="text-sm mt-1">{formData.returnLocation}</p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{t("booking.customerInfo")}</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" /> {formData.name}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {formData.phone}
                      </p>
                      {formData.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> {formData.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    {t("common.previous")}
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        กำลังจอง...
                      </>
                    ) : (
                      t("booking.confirmBooking")
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  อัปโหลดเอกสาร
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      บัตรประชาชน (ด้านหน้า) <span className="text-red-500">*</span>
                    </Label>
                    <input
                      ref={idCardFrontRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, setIdCardFront)}
                    />
                    {idCardFront ? (
                      <div className="relative border rounded-lg p-2">
                        <div className="aspect-video relative rounded overflow-hidden bg-muted">
                          <Image
                            src={idCardFront.preview}
                            alt="บัตรประชาชนด้านหน้า"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIdCardFront(null)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => idCardFrontRef.current?.click()}
                        className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">คลิกเพื่อเลือกรูปภาพ</p>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      ใบขับขี่ <span className="text-red-500">*</span>
                    </Label>
                    <input
                      ref={driverLicenseRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, setDriverLicense)}
                    />
                    {driverLicense ? (
                      <div className="relative border rounded-lg p-2">
                        <div className="aspect-video relative rounded overflow-hidden bg-muted">
                          <Image
                            src={driverLicense.preview}
                            alt="ใบขับขี่"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setDriverLicense(null)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => driverLicenseRef.current?.click()}
                        className="w-full p-8 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
                      >
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">คลิกเพื่อเลือกรูปภาพ</p>
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleUploadDocuments}
                    disabled={uploadingDocs || !idCardFront || !driverLicense}
                  >
                    {uploadingDocs ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        อัปโหลดเอกสาร
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card className="text-center">
              <CardContent className="pt-12 pb-12 space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-600">
                    {t("booking.bookingSuccess")}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {t("booking.thankYou")}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg inline-block">
                  <p className="text-sm text-muted-foreground">
                    {t("booking.bookingNumber")}
                  </p>
                  <p className="text-2xl font-bold font-mono">{bookingNumber}</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-sm mx-auto">
                  <p className="text-sm text-blue-600 font-medium mb-2">ข้อมูลร้านเช่ารถ</p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{car.partner.name}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <a href={`tel:${car.partner.phone}`} className="text-blue-600 hover:underline">
                        {car.partner.phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-left max-w-sm mx-auto">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">กรุณารอการติดต่อกลับ</p>
                      <p className="text-sm text-amber-700 mt-1">
                        ทางร้านจะติดต่อกลับภายใน <span className="font-semibold">15-30 นาที</span> เพื่อยืนยันการจอง
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link href="/cars">
                    <Button>{t("common.back")}</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 bg-muted rounded flex items-center justify-center relative overflow-hidden">
                  {car.images && car.images[0] ? (
                    <Image
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Car className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-sm text-muted-foreground">{car.year}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("booking.pricePerDay")}
                  </span>
                  <span>{Number(car.pricePerDay).toLocaleString()} THB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("booking.totalDays")}
                  </span>
                  <span>{calculateDays()} วัน</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>{t("booking.totalPrice")}</span>
                <span className="text-primary">
                  {totalPrice.toLocaleString()} THB
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
