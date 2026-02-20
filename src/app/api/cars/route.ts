
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import { getPublicUrl } from "@/lib/storage"

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: List all cars
 *     description: Retrieve a paginated list of available cars with optional filters.
 *     tags:
 *       - Cars
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [SEDAN, SUV, VAN, PICKUP, LUXURY, COMPACT, MOTORCYCLE]
 *         description: Filter by car category
 *     responses:
 *       200:
 *         description: List of cars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")
        const transmission = searchParams.get("transmission")
        const fuelType = searchParams.get("fuelType")
        const brand = searchParams.get("brand")
        const year = searchParams.get("year")
        const minPrice = searchParams.get("minPrice")
        const maxPrice = searchParams.get("maxPrice")
        const sort = searchParams.get("sort")
        const search = searchParams.get("search")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Max 100 per page
        const skip = (page - 1) * limit

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            rentalStatus: "AVAILABLE",
            approvalStatus: "APPROVED"
        }

        if (category) {
            where.category = category
        }

        if (transmission) {
            where.transmission = transmission
        }

        if (fuelType) {
            where.fuelType = fuelType
        }

        if (brand) {
            where.brand = { contains: brand, mode: "insensitive" }
        }

        if (year) {
            where.year = parseInt(year)
        }

        if (minPrice || maxPrice) {
            where.pricePerDay = {}
            if (minPrice) where.pricePerDay.gte = parseFloat(minPrice)
            if (maxPrice) where.pricePerDay.lte = parseFloat(maxPrice)
        }

        if (search) {
            // Map Thai brand names to English
            const thaiBrandMap: Record<string, string> = {
                "ฮอนด้า": "HONDA", "honda": "HONDA",
                "โตโยต้า": "TOYOTA", "toyota": "TOYOTA",
                "นิสสัน": "NISSAN", "nissan": "NISSAN",
                "มาสด้า": "MAZDA", "mazda": "MAZDA",
                "ซูซูกิ": "SUZUKI", "suzuki": "SUZUKI",
                "มิตซูบิชิ": "MITSUBISHI", "mitsubishi": "MITSUBISHI",
                "อีซูซุ": "ISUZU", "isuzu": "ISUZU",
                "เอ็มจี": "MG", "mg": "MG",
                "บีวายดี": "BYD", "byd": "BYD",
                "เนต้า": "NETA", "neta": "NETA",
                "เกรทวอลล์": "GWM", "gwm": "GWM",
                "เบนซ์": "MERCEDES", "benz": "MERCEDES", "mercedes": "MERCEDES",
                "บีเอ็ม": "BMW", "bmw": "BMW",
                "ฟอร์ด": "FORD", "ford": "FORD",
                "เชฟโรเลต": "CHEVROLET", "chevrolet": "CHEVROLET",
                "วอลโว่": "VOLVO", "volvo": "VOLVO",
                "ซูบารุ": "SUBARU", "subaru": "SUBARU",
                "เทสล่า": "TESLA", "tesla": "TESLA",
                "ไอออน": "AION", "aion": "AION",
                "ลีปมอเตอร์": "LEAPMOTOR", "leapmotor": "LEAPMOTOR",
            }
            // Map Thai keywords to enum values
            const thaiToFuelType: Record<string, string> = {
                "ไฟฟ้า": "EV", "รถไฟฟ้า": "EV", "อีวี": "EV", "ev": "EV",
                "เบนซิน": "PETROL", "แก๊ส": "PETROL",
                "ดีเซล": "DIESEL",
                "ไฮบริด": "HYBRID", "hybrid": "HYBRID",
            }
            const thaiToCategory: Record<string, string> = {
                "เก๋ง": "SEDAN", "ซีดาน": "SEDAN", "sedan": "SEDAN",
                "suv": "SUV", "เอสยูวี": "SUV",
                "แวน": "VAN", "ตู้": "VAN", "van": "VAN",
                "กระบะ": "PICKUP", "ปิคอัพ": "PICKUP", "pickup": "PICKUP",
                "หรู": "LUXURY", "luxury": "LUXURY",
                "เล็ก": "COMPACT", "compact": "COMPACT",
                "มอเตอร์ไซค์": "MOTORCYCLE", "มอไซค์": "MOTORCYCLE", "บิ๊กไบค์": "MOTORCYCLE",
            }
            const thaiToTransmission: Record<string, string> = {
                "ออโต้": "AUTO", "auto": "AUTO", "อัตโนมัติ": "AUTO",
                "ธรรมดา": "MANUAL", "เกียร์ธรรมดา": "MANUAL", "manual": "MANUAL",
            }
            // Map Thai model names
            const thaiModelMap: Record<string, string> = {
                "ซีวิค": "CIVIC", "civic": "CIVIC",
                "ซิตี้": "CITY", "city": "CITY",
                "แอคคอร์ด": "ACCORD", "accord": "ACCORD",
                "ซีอาร์วี": "CR-V", "crv": "CR-V", "cr-v": "CR-V",
                "เอชอาร์วี": "HR-V", "hrv": "HR-V", "hr-v": "HR-V",
                "แจ๊ส": "JASS", "jazz": "JASS", "jass": "JASS",
                "แคมรี่": "CAMRY", "camry": "CAMRY",
                "อัลติส": "ALTIS", "altis": "ALTIS",
                "ยาริส": "YARIS", "yaris": "YARIS",
                "คอมมิวเตอร์": "COMMUTER", "commuter": "COMMUTER",
                "ดอลฟิน": "DOLPHIN", "dolphin": "DOLPHIN",
            }

            const searchLower = search.toLowerCase()
            const matchedBrand = thaiBrandMap[searchLower] || thaiBrandMap[search]
            const matchedFuelType = thaiToFuelType[searchLower] || thaiToFuelType[search]
            const matchedCategory = thaiToCategory[searchLower] || thaiToCategory[search]
            const matchedTransmission = thaiToTransmission[searchLower] || thaiToTransmission[search]
            const matchedModel = thaiModelMap[searchLower] || thaiModelMap[search]

            const orConditions: Record<string, unknown>[] = [
                { brand: { contains: search, mode: "insensitive" } },
                { model: { contains: search, mode: "insensitive" } },
                { licensePlate: { contains: search, mode: "insensitive" } },
            ]

            if (matchedBrand) orConditions.push({ brand: { contains: matchedBrand, mode: "insensitive" } })
            if (matchedModel) orConditions.push({ model: { contains: matchedModel, mode: "insensitive" } })
            if (matchedFuelType) orConditions.push({ fuelType: matchedFuelType })
            if (matchedCategory) orConditions.push({ category: matchedCategory })
            if (matchedTransmission) orConditions.push({ transmission: matchedTransmission })

            where.OR = orConditions
        }

        // Sorting
        let orderBy: Record<string, string> = { createdAt: "desc" }
        if (sort === "price_asc") {
            orderBy = { pricePerDay: "asc" }
        } else if (sort === "price_desc") {
            orderBy = { pricePerDay: "desc" }
        }

        const baseWhere = { rentalStatus: "AVAILABLE" as const, approvalStatus: "APPROVED" as const }

        const [cars, total, availableCategories, availableBrands, availableYears] = await Promise.all([
            prisma.car.findMany({
                where,
                orderBy,
                include: {
                    partner: {
                        select: {
                            name: true,
                            logoUrl: true
                        }
                    }
                },
                skip,
                take: limit,
            }),
            prisma.car.count({ where }),
            prisma.car.groupBy({
                by: ['category'],
                where: baseWhere,
                _count: { category: true }
            }),
            prisma.car.groupBy({
                by: ['brand'],
                where: baseWhere,
                _count: { brand: true },
                orderBy: { brand: 'asc' }
            }),
            prisma.car.groupBy({
                by: ['year'],
                where: baseWhere,
                _count: { year: true },
                orderBy: { year: 'desc' }
            }),
        ])

        const carsWithUrls = cars.map((car) => ({
            ...car,
            images: Array.isArray(car.images)
                ? (car.images as string[]).map((img) => {
                    // If it's a Supabase URL with uploads/, extract and use local path
                    if (img.includes("supabase.co") && img.includes("/uploads/")) {
                        const match = img.match(/\/uploads\/.*$/)
                        if (match) return match[0]
                    }
                    // If path already starts with /uploads/, use as-is
                    if (img.startsWith("/uploads/")) return img
                    if (img.startsWith("http")) return img
                    if (img.startsWith("uploads/")) return `/${img}`
                    return getPublicUrl("car-images", img)
                })
                : [],
            partner: {
                ...car.partner,
                logoUrl: car.partner.logoUrl
                    ? car.partner.logoUrl.startsWith("http")
                        ? car.partner.logoUrl
                        : getPublicUrl("avatars", car.partner.logoUrl)
                    : null,
            },
        }))

        return NextResponse.json({
            cars: carsWithUrls,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            categories: availableCategories.map(c => c.category),
            brands: availableBrands.map(b => ({ name: b.brand, count: b._count.brand })),
            years: availableYears.map(y => ({ year: y.year, count: y._count.year })),
        })
    } catch (error) {
        console.error("Error fetching cars:", error)
        return NextResponse.json(
            { error: "Failed to fetch cars" },
            { status: 500 }
        )
    }
}
