import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        cars: true,
        admins: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            cars: true,
            bookings: true,
          },
        },
      },
    })

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ partner })
  } catch (error) {
    console.error("Error fetching partner:", error)
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const partner = await prisma.partner.findUnique({
      where: { id },
    })

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      )
    }

    const updatedPartner = await prisma.partner.update({
      where: { id },
      data: {
        name: body.name,
        contactEmail: body.contactEmail,
        phone: body.phone,
        commissionRate: body.commissionRate ? parseFloat(body.commissionRate) : undefined,
        status: body.status,
        telegramChatId: body.telegramChatId,
        minAdvanceHours: body.minAdvanceHours ? parseInt(body.minAdvanceHours) : undefined,
        operatingHours: body.operatingHours,
      },
    })

    return NextResponse.json({ partner: updatedPartner })
  } catch (error) {
    console.error("Error updating partner:", error)
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const partner = await prisma.partner.findUnique({
      where: { id },
    })

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      )
    }

    await prisma.partner.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Partner deleted successfully" })
  } catch (error) {
    console.error("Error deleting partner:", error)
    return NextResponse.json(
      { error: "Failed to delete partner" },
      { status: 500 }
    )
  }
}
