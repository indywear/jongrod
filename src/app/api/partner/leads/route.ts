import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"

/**
 * @swagger
 * /api/partner/leads:
 *   get:
 *     tags:
 *       - Partner
 *     summary: List partner's booking leads
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CLAIMED, PICKUP, ACTIVE, RETURN, COMPLETED, CANCELLED]
 *         description: Filter leads by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of booking leads with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leads:
 *                   type: array
 *                   items:
 *                     type: object
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
 *         description: Unauthorized - not authenticated or not a partner
 */
export async function GET(request: NextRequest) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId") || authResult.user.partnerId
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    if (!partnerId) {
      return NextResponse.json({ leads: [], pagination: null })
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const where: Record<string, unknown> = { partnerId }

    if (status && ["NEW", "CLAIMED", "PICKUP", "ACTIVE", "RETURN", "COMPLETED", "CANCELLED"].includes(status)) {
      where.leadStatus = status
    }

    // Get bookings with pagination
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
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    // Get only relevant blacklist entries (by phones in current bookings)
    const customerPhones = bookings
      .map(b => b.user?.phone || b.customerPhone)
      .filter(Boolean) as string[]

    const blacklistEntries = customerPhones.length > 0
      ? await prisma.blacklist.findMany({
          where: {
            OR: [
              { phone: { in: customerPhones } },
            ],
          },
          select: {
            phone: true,
            fullName: true,
          },
        })
      : []

    const blacklistPhones = new Set(blacklistEntries.map(b => b.phone).filter(Boolean))
    const blacklistNames = new Set(blacklistEntries.map(b => b.fullName.toLowerCase()))

    const leads = bookings.map((booking) => {
      const customerName = booking.user
        ? `${booking.user.firstName} ${booking.user.lastName}`
        : booking.customerName || "ลูกค้า"
      const customerPhone = booking.user?.phone || booking.customerPhone || "-"

      const isBlacklisted = blacklistPhones.has(customerPhone) ||
        blacklistNames.has(customerName.toLowerCase())

      return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName,
        customerPhone,
        customerEmail: booking.customerEmail,
        car: { brand: booking.car.brand, model: booking.car.model, year: booking.car.year },
        pickupDate: booking.pickupDatetime.toISOString().split("T")[0],
        returnDate: booking.returnDatetime.toISOString().split("T")[0],
        pickupLocation: booking.pickupLocation,
        returnLocation: booking.returnLocation,
        customerNote: booking.customerNote,
        totalPrice: Number(booking.totalPrice),
        status: booking.leadStatus,
        isBlacklisted,
      }
    })

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ leads: [], pagination: null })
  }
}
