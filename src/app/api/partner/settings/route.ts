import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
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

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    const existingPartner = await prisma.partner.findUnique({
      where: { id: partnerId },
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
      where: { id: partnerId },
      data: updateData,
    })

    return NextResponse.json({ partner: updatedPartner })
  } catch (error) {
    console.error("Error updating partner settings:", error)
    return NextResponse.json(
      { error: "Failed to update partner settings", details: String(error) },
      { status: 500 }
    )
  }
}
