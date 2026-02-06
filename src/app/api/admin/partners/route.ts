import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { cars: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.partner.count(),
    ])

    return NextResponse.json({
      partners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching partners:", error)
    return NextResponse.json({ partners: [], pagination: null })
  }
}
