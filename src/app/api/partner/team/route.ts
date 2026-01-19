import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")

    if (!partnerId) {
      return NextResponse.json({ team: [] })
    }

    const partnerAdmins = await prisma.partnerAdmin.findMany({
      where: { partnerId },
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

    const team = partnerAdmins.map((admin) => ({
      id: admin.id,
      userId: admin.user.id,
      name: `${admin.user.firstName} ${admin.user.lastName}`,
      email: admin.user.email || "",
      phone: admin.user.phone || "",
      role: admin.role,
      canClaimLeads: admin.canClaimLeads,
      joinedAt: admin.createdAt.toISOString().split("T")[0],
    }))

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Error fetching partner team:", error)
    return NextResponse.json({ team: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partnerId, email, role } = body

    if (!partnerId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      )
    }

    const existing = await prisma.partnerAdmin.findUnique({
      where: {
        partnerId_userId: {
          partnerId,
          userId: user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      )
    }

    const partnerAdmin = await prisma.partnerAdmin.create({
      data: {
        partnerId,
        userId: user.id,
        role,
        canClaimLeads: true,
      },
    })

    return NextResponse.json({ partnerAdmin })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, canClaimLeads } = body

    if (!id || canClaimLeads === undefined) {
      return NextResponse.json(
        { error: "ID and canClaimLeads are required" },
        { status: 400 }
      )
    }

    const partnerAdmin = await prisma.partnerAdmin.update({
      where: { id },
      data: { canClaimLeads },
    })

    return NextResponse.json({ partnerAdmin })
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    await prisma.partnerAdmin.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    )
  }
}
