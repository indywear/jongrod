import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"
import { z } from "zod"

const addTeamMemberSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["OWNER", "ADMIN", "STAFF"]),
})

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
      return NextResponse.json({ team: [] })
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
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
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()

    // Validate input
    const validation = addTeamMemberSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const partnerId = body.partnerId || authResult.user.partnerId

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const { email, role } = validation.data

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

    // Update user role to PARTNER_ADMIN if not already
    if (user.role !== "PARTNER_ADMIN" && user.role !== "PLATFORM_OWNER") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PARTNER_ADMIN" },
      })
    }

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
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id, canClaimLeads } = body

    if (!id || canClaimLeads === undefined) {
      return NextResponse.json(
        { error: "ID and canClaimLeads are required" },
        { status: 400 }
      )
    }

    // Get the partner admin to verify ownership
    const existingAdmin = await prisma.partnerAdmin.findUnique({
      where: { id },
    })

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, existingAdmin.partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
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
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    // Get the partner admin to verify ownership
    const existingAdmin = await prisma.partnerAdmin.findUnique({
      where: { id },
    })

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, existingAdmin.partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
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
