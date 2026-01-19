import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, rejectionReason, reviewedById, partnerId } = body

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            bookings: {
              where: { partnerId },
              take: 1,
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    if (partnerId && document.user.bookings.length === 0) {
      return NextResponse.json(
        { error: "Not authorized to review this document" },
        { status: 403 }
      )
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedById: reviewedById || null,
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
