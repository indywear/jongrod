import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * @swagger
 * /api/admin/leads:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all booking leads across all partners
 *     description: Returns paginated booking leads with optional filtering by status, partner, and search term.
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CLAIMED, PICKUP, ACTIVE, RETURN, COMPLETED, CANCELLED]
 *         description: Filter by lead status
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Filter by partner ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name, phone, or booking number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of booking leads with pagination
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const partnerId = searchParams.get("partnerId")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (
      status &&
      ["NEW", "CLAIMED", "PICKUP", "ACTIVE", "RETURN", "COMPLETED", "CANCELLED"].includes(status)
    ) {
      where.leadStatus = status
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { bookingNumber: { contains: search, mode: "insensitive" } },
      ]
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          car: {
            select: {
              brand: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
          partner: {
            select: {
              name: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    )
  }
}
