import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get("position")

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (position) {
      where.position = position
    }

    const now = new Date()
    where.OR = [
      { startDate: null, endDate: null },
      { startDate: { lte: now }, endDate: null },
      { startDate: null, endDate: { gte: now } },
      { startDate: { lte: now }, endDate: { gte: now } },
    ]

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error("Error fetching active banners:", error)
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    )
  }
}
