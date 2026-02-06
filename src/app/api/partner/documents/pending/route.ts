import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"

export async function GET(request: NextRequest) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId") || authResult.user.partnerId

    if (!partnerId) {
      return NextResponse.json({ documents: [] })
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const bookings = await prisma.booking.findMany({
      where: { partnerId },
      select: { userId: true },
    })

    const userIds = [...new Set(bookings.map((b) => b.userId).filter(Boolean))] as string[]

    if (userIds.length === 0) {
      return NextResponse.json({ documents: [] })
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: { in: userIds },
        status: "PENDING",
      },
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
    console.error("Error fetching pending documents for partner:", error)
    return NextResponse.json({ documents: [] })
  }
}
