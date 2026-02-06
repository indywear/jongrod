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
    const documents = await prisma.document.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching pending documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
