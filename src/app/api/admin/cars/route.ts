import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    
    if (status) {
      where.approvalStatus = status
    }

    const cars = await prisma.car.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        partner: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ cars })
  } catch (error) {
    console.error("Error fetching cars:", error)
    return NextResponse.json({ cars: [] })
  }
}
