import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as "PENDING" | "PAID" | null
    const partnerId = searchParams.get("partnerId")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (partnerId) where.partnerId = partnerId

    const commissions = await prisma.commissionLog.findMany({
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
    })

    const summary = await prisma.commissionLog.aggregate({
      where,
      _sum: {
        commissionAmount: true,
      },
      _count: true,
    })

    return NextResponse.json({
      commissions,
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
