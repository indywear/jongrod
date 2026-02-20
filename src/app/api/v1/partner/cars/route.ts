import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiKey } from "@/lib/api-key"
import { getPublicUrl } from "@/lib/storage"

/**
 * @swagger
 * /api/v1/partner/cars:
 *   get:
 *     summary: List partner's cars
 *     description: Returns all cars belonging to the partner linked to the API key. Shows all rental statuses (AVAILABLE/RENTED/MAINTENANCE).
 *     tags:
 *       - External Partner
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: rentalStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, RENTED, MAINTENANCE]
 *       - name: approvalStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of partner's cars
 *       401:
 *         description: Invalid API key
 *       403:
 *         description: API key not linked to a partner
 */
export async function GET(request: NextRequest) {
  const apiKeyResult = await requireApiKey(request, ["read"])
  if (apiKeyResult instanceof NextResponse) return apiKeyResult

  if (!apiKeyResult.partnerId) {
    return NextResponse.json(
      { error: "This API key is not linked to a partner" },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const rentalStatus = searchParams.get("rentalStatus")
    const approvalStatus = searchParams.get("approvalStatus")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { partnerId: apiKeyResult.partnerId }
    if (rentalStatus) where.rentalStatus = rentalStatus
    if (approvalStatus) where.approvalStatus = approvalStatus

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        orderBy: { createdAt: "desc" },
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
    }))

    return NextResponse.json({
      cars: carsWithUrls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("V1 partner cars error:", error)
    return NextResponse.json(
      { error: "Failed to fetch partner cars" },
      { status: 500 }
    )
  }
}
