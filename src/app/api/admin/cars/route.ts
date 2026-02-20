import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * @swagger
 * /api/admin/cars:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all cars (admin view)
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
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
 *         description: List of cars with pagination
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.approvalStatus = status
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          partner: {
            select: {
              name: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.car.count({ where }),
    ])

    return NextResponse.json({
      cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching cars:", error)
    return NextResponse.json({ cars: [], pagination: null })
  }
}
