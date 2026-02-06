import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status, rejectionReason } = body

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (APPROVED or REJECTED) is required" },
        { status: 400 }
      )
    }

    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      )
    }

    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Use authenticated user's ID as reviewer
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedById: authResult.user.id,
      },
    })

    return NextResponse.json({ document: updatedDocument })
  } catch (error) {
    console.error("Error reviewing document:", error)
    return NextResponse.json(
      { error: "Failed to review document" },
      { status: 500 }
    )
  }
}
