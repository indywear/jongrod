import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiKey } from "@/lib/api-key"
import { getPublicUrl } from "@/lib/storage"

/**
 * @swagger
 * /api/v1/cars:
 *   get:
 *     summary: List cars (external API)
 *     description: Retrieve a paginated list of cars. Supports filtering by rentalStatus (AVAILABLE/RENTED/MAINTENANCE), category, transmission, fuelType, price range, and search.
 *     tags:
 *       - External Cars
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: rentalStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, RENTED, MAINTENANCE]
 *         description: Filter by rental status (default AVAILABLE)
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [SEDAN, SUV, VAN, PICKUP, LUXURY, COMPACT, MOTORCYCLE]
 *       - name: transmission
 *         in: query
 *         schema:
 *           type: string
 *           enum: [AUTO, MANUAL]
 *       - name: fuelType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PETROL, DIESEL, HYBRID, EV]
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by brand or model
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Invalid or missing API key
 */
export async function GET(request: NextRequest) {
  const apiKeyResult = await requireApiKey(request, ["read"])
  if (apiKeyResult instanceof NextResponse) return apiKeyResult

  try {
    const { searchParams } = new URL(request.url)
    const rentalStatus = searchParams.get("rentalStatus")
    const category = searchParams.get("category")
    const transmission = searchParams.get("transmission")
    const fuelType = searchParams.get("fuelType")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      approvalStatus: "APPROVED",
    }

    // If API key is tied to a partner, only show that partner's cars
    if (apiKeyResult.partnerId) {
      where.partnerId = apiKeyResult.partnerId
    }

    // Filter by rentalStatus (default: show all statuses for API users)
    if (rentalStatus) {
      where.rentalStatus = rentalStatus
    }

    if (category) where.category = category
    if (transmission) where.transmission = transmission
    if (fuelType) where.fuelType = fuelType

    if (minPrice || maxPrice) {
      where.pricePerDay = {}
      if (minPrice) where.pricePerDay.gte = parseFloat(minPrice)
      if (maxPrice) where.pricePerDay.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ]
    }

    let orderBy: Record<string, string> = { createdAt: "desc" }
    if (sort === "price_asc") orderBy = { pricePerDay: "asc" }
    else if (sort === "price_desc") orderBy = { pricePerDay: "desc" }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        orderBy,
        include: {
          partner: {
            select: { id: true, name: true, logoUrl: true, phone: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.car.count({ where }),
    ])

    const carsWithUrls = cars.map((car) => ({
      ...car,
      images: Array.isArray(car.images)
        ? (car.images as string[]).map((img) => {
            if (img.includes("supabase.co") && img.includes("/uploads/")) {
              const match = img.match(/\/uploads\/.*$/)
              if (match) return match[0]
            }
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
    })
  } catch (error) {
    console.error("V1 cars error:", error)
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    )
  }
}
