import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const updatePartnerSchema = z.object({
  name: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().min(9).optional(),
  commissionRate: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  telegramChatId: z.string().optional(),
  minAdvanceHours: z.union([z.string(), z.number()]).optional(),
  operatingHours: z.string().optional(),
})

export async function GET(
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
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validation = updatePartnerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const partner = await prisma.partner.findUnique({
      where: { id },
    })

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      )
    }

    const data = validation.data
    const updatedPartner = await prisma.partner.update({
      where: { id },
      data: {
        name: data.name,
        contactEmail: data.contactEmail,
        phone: data.phone,
        commissionRate: data.commissionRate ? parseFloat(String(data.commissionRate)) : undefined,
        status: data.status,
        telegramChatId: data.telegramChatId,
        minAdvanceHours: data.minAdvanceHours ? parseInt(String(data.minAdvanceHours)) : undefined,
        operatingHours: data.operatingHours,
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
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

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
