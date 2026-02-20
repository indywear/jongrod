import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiKey } from "@/lib/api-key"

/**
 * @swagger
 * /api/v1/partner/leads:
 *   get:
 *     summary: List partner's booking leads
 *     description: Returns all booking leads for the partner linked to the API key.
 *     tags:
 *       - External Partner
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [NEW, CLAIMED, PICKUP, ACTIVE, RETURN, COMPLETED, CANCELLED]
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
 *     responses:
 *       200:
 *         description: List of booking leads
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
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { partnerId: apiKeyResult.partnerId }
    if (status) where.leadStatus = status

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          car: {
            select: {
              id: true, brand: true, model: true, year: true,
              licensePlate: true, category: true, pricePerDay: true,
              rentalStatus: true,
            },
          },
          user: {
            select: {
              id: true, firstName: true, lastName: true,
              email: true, phone: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      leads: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("V1 partner leads error:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    )
  }
}
