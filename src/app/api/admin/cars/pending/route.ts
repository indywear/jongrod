import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * @swagger
 * /api/admin/cars/pending:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List cars pending approval
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of cars with PENDING approval status
 */
export async function GET(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const cars = await prisma.car.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ cars })
  } catch (error) {
    console.error("Error fetching pending cars:", error)
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    )
  }
}
