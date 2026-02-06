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
    const status = searchParams.get("status")
    const partnerId = searchParams.get("partnerId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && ["PENDING", "PAID"].includes(status)) {
      where.status = status
    }
    if (partnerId) {
      where.partnerId = partnerId
    }

    const [commissions, total, summary] = await Promise.all([
      prisma.commissionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          partner: {
            select: {
              id: true,
              name: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              customerName: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.commissionLog.count({ where }),
      prisma.commissionLog.aggregate({
        where,
        _sum: {
          commissionAmount: true,
        },
        _count: true,
      }),
    ])

    return NextResponse.json({
      commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total: summary._sum.commissionAmount || 0,
        count: summary._count,
      },
    })
  } catch (error) {
    console.error("Error fetching commissions:", error)
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    )
  }
}
