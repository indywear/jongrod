import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { cars: true },
        },
      },
    })

    return NextResponse.json({ partners })
  } catch (error) {
    console.error("Error fetching partners:", error)
    return NextResponse.json({ partners: [] })
  }
}
