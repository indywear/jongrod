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
