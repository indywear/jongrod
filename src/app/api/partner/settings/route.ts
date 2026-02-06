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

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        phone: true,
        contactEmail: true,
        minAdvanceHours: true,
        telegramChatId: true,
        operatingHours: true,
        pickupLocations: true,
        logoUrl: true,
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
    console.error("Error fetching partner settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch partner settings" },
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
    const {
      partnerId,
      name,
      phone,
      contactEmail,
      minAdvanceHours,
      telegramChatId,
      operatingHours,
      pickupLocations,
    } = body

    const targetPartnerId = partnerId || authResult.user.partnerId

    if (!targetPartnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, targetPartnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const existingPartner = await prisma.partner.findUnique({
      where: { id: targetPartnerId },
    })

    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail
    if (minAdvanceHours !== undefined) updateData.minAdvanceHours = parseInt(minAdvanceHours.toString()) || 24
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId || null
    if (operatingHours !== undefined) updateData.operatingHours = operatingHours
    if (pickupLocations !== undefined) updateData.pickupLocations = Array.isArray(pickupLocations) ? pickupLocations : []

    const updatedPartner = await prisma.partner.update({
      where: { id: targetPartnerId },
      data: updateData,
    })

    return NextResponse.json({ partner: updatedPartner })
  } catch (error) {
    console.error("Error updating partner settings:", error)
    return NextResponse.json(
      { error: "Failed to update partner settings" },
      { status: 500 }
    )
  }
}
