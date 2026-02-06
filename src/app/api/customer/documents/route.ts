import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCustomer, verifyUserOwnership } from "@/lib/auth"

export async function GET(request: NextRequest) {
  // Require customer role
  const authResult = await requireCustomer(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || authResult.user.id

    // Verify user ownership
    const ownershipResult = await verifyUserOwnership(request, userId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
