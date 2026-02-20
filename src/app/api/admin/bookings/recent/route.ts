import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * @swagger
 * /api/admin/bookings/recent:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List recent bookings
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of today's most recent bookings (up to 10)
 */
export async function GET(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        bookingNumber: true,
        customerName: true,
        createdAt: true,
        leadStatus: true,
        car: {
          select: {
            brand: true,
            model: true,
          },
        },
        partner: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching recent bookings:", error)
    return NextResponse.json({ bookings: [] })
  }
}
