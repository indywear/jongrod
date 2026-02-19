import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner } from "@/lib/auth"
import { z } from "zod"

const VALID_CATEGORIES = ["SEDAN", "SUV", "VAN", "PICKUP", "LUXURY", "COMPACT", "MOTORCYCLE"] as const
const VALID_TRANSMISSIONS = ["AUTO", "MANUAL"] as const
const VALID_FUEL_TYPES = ["PETROL", "DIESEL", "HYBRID", "EV"] as const

const carRowSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  licensePlate: z.string().min(1),
  category: z.enum(VALID_CATEGORIES),
  transmission: z.enum(VALID_TRANSMISSIONS),
  fuelType: z.enum(VALID_FUEL_TYPES),
  seats: z.number().int().min(1).max(50),
  doors: z.number().int().min(0).max(10),
  pricePerDay: z.number().positive(),
})

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(request: NextRequest) {
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const partnerId = authResult.user.partnerId
  if (!partnerId) {
    return NextResponse.json(
      { error: "Partner ID is required" },
      { status: 400 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "กรุณาเลือกไฟล์ CSV" },
        { status: 400 }
      )
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ .csv เท่านั้น" },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 5MB" },
        { status: 400 }
      )
    }

    const text = await file.text()
    // Remove BOM if present
    const cleanText = text.replace(/^\uFEFF/, "")
    const lines = cleanText.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "ไฟล์ต้องมีอย่างน้อย 1 แถวข้อมูล (นอกเหนือจากหัวตาราง)" },
        { status: 400 }
      )
    }

    // Parse header
    const headerLine = parseCSVLine(lines[0])
    const expectedHeaders = [
      "brand", "model", "year", "licensePlate", "category",
      "transmission", "fuelType", "seats", "doors", "pricePerDay",
    ]

    // Map Thai headers to English field names
    const thaiHeaderMap: Record<string, string> = {
      "ยี่ห้อ": "brand",
      "รุ่น": "model",
      "ปี": "year",
      "ทะเบียน": "licensePlate",
      "ประเภท": "category",
      "เกียร์": "transmission",
      "เชื้อเพลิง": "fuelType",
      "ที่นั่ง": "seats",
      "ประตู": "doors",
      "ราคา/วัน": "pricePerDay",
    }

    // Determine header mapping (support both Thai and English headers)
    const headerMap: Record<number, string> = {}
    for (let i = 0; i < headerLine.length; i++) {
      const h = headerLine[i].trim()
      const englishName = thaiHeaderMap[h] || h
      if (expectedHeaders.includes(englishName)) {
        headerMap[i] = englishName
      }
    }

    const mappedFields = Object.values(headerMap)
    const missingFields = expectedHeaders.filter((f) => !mappedFields.includes(f))
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `หัวตารางไม่ครบ ขาด: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }

    // Category/Transmission/FuelType Thai-to-enum maps
    const categoryMap: Record<string, string> = {
      "ซีดาน": "SEDAN", "เก๋ง": "SEDAN",
      "เอสยูวี": "SUV",
      "ตู้": "VAN", "แวน": "VAN",
      "กระบะ": "PICKUP",
      "หรูหรา": "LUXURY", "พรีเมียม": "LUXURY",
      "เล็ก": "COMPACT", "อีโคคาร์": "COMPACT",
      "มอเตอร์ไซค์": "MOTORCYCLE", "จักรยานยนต์": "MOTORCYCLE",
    }
    const transmissionMap: Record<string, string> = {
      "อัตโนมัติ": "AUTO", "ออโต้": "AUTO",
      "ธรรมดา": "MANUAL", "แมนนวล": "MANUAL",
    }
    const fuelTypeMap: Record<string, string> = {
      "เบนซิน": "PETROL",
      "ดีเซล": "DIESEL",
      "ไฮบริด": "HYBRID",
      "ไฟฟ้า": "EV",
    }

    const results: { row: number; success: boolean; error?: string; licensePlate?: string }[] = []
    const carsToCreate: z.infer<typeof carRowSchema>[] = []

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.every((v) => !v.trim())) continue // skip empty rows

      const rowData: Record<string, string | number> = {}
      for (const [colIndex, fieldName] of Object.entries(headerMap)) {
        const value = values[parseInt(colIndex)] || ""
        rowData[fieldName] = value
      }

      // Resolve Thai values to enum values
      const rawCategory = String(rowData.category || "").toUpperCase()
      const resolvedCategory = VALID_CATEGORIES.includes(rawCategory as typeof VALID_CATEGORIES[number])
        ? rawCategory
        : categoryMap[String(rowData.category || "").trim()] || rawCategory

      const rawTransmission = String(rowData.transmission || "").toUpperCase()
      const resolvedTransmission = VALID_TRANSMISSIONS.includes(rawTransmission as typeof VALID_TRANSMISSIONS[number])
        ? rawTransmission
        : transmissionMap[String(rowData.transmission || "").trim()] || rawTransmission

      const rawFuelType = String(rowData.fuelType || "").toUpperCase()
      const resolvedFuelType = VALID_FUEL_TYPES.includes(rawFuelType as typeof VALID_FUEL_TYPES[number])
        ? rawFuelType
        : fuelTypeMap[String(rowData.fuelType || "").trim()] || rawFuelType

      const parsed = {
        brand: String(rowData.brand || "").trim(),
        model: String(rowData.model || "").trim(),
        year: parseInt(String(rowData.year)),
        licensePlate: String(rowData.licensePlate || "").trim(),
        category: resolvedCategory,
        transmission: resolvedTransmission,
        fuelType: resolvedFuelType,
        seats: parseInt(String(rowData.seats)),
        doors: parseInt(String(rowData.doors)),
        pricePerDay: parseFloat(String(rowData.pricePerDay)),
      }

      const validation = carRowSchema.safeParse(parsed)
      if (!validation.success) {
        const firstError = validation.error.issues[0]
        results.push({
          row: i + 1,
          success: false,
          error: `${firstError.path.join(".")}: ${firstError.message}`,
          licensePlate: parsed.licensePlate || undefined,
        })
      } else {
        carsToCreate.push(validation.data)
        results.push({ row: i + 1, success: true, licensePlate: validation.data.licensePlate })
      }
    }

    if (carsToCreate.length === 0) {
      return NextResponse.json({
        success: false,
        message: "ไม่มีข้อมูลที่ถูกต้องสำหรับ Import",
        results,
        imported: 0,
        errors: results.filter((r) => !r.success).length,
      })
    }

    // Check for duplicate license plates in existing database
    const licensePlates = carsToCreate.map((c) => c.licensePlate)
    const existing = await prisma.car.findMany({
      where: { licensePlate: { in: licensePlates } },
      select: { licensePlate: true },
    })
    const existingPlates = new Set(existing.map((c) => c.licensePlate))

    const newCars = carsToCreate.filter((c) => !existingPlates.has(c.licensePlate))
    const duplicates = carsToCreate.filter((c) => existingPlates.has(c.licensePlate))

    // Mark duplicates as errors
    for (const dup of duplicates) {
      const resultEntry = results.find(
        (r) => r.success && r.licensePlate === dup.licensePlate
      )
      if (resultEntry) {
        resultEntry.success = false
        resultEntry.error = `ทะเบียน "${dup.licensePlate}" มีอยู่ในระบบแล้ว`
      }
    }

    // Create new cars
    let importedCount = 0
    for (const car of newCars) {
      try {
        await prisma.car.create({
          data: {
            ...car,
            partnerId,
            pricePerDay: car.pricePerDay,
            features: [],
            images: [],
            approvalStatus: "PENDING",
            rentalStatus: "AVAILABLE",
          },
        })
        importedCount++
      } catch (err) {
        const resultEntry = results.find(
          (r) => r.success && r.licensePlate === car.licensePlate
        )
        if (resultEntry) {
          resultEntry.success = false
          resultEntry.error = `เกิดข้อผิดพลาดในการบันทึก`
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import สำเร็จ ${importedCount} คัน`,
      imported: importedCount,
      errors: results.filter((r) => !r.success).length,
      total: results.length,
      results,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการ Import" },
      { status: 500 }
    )
  }
}
