import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"

const VALID_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CLAIMED", "CANCELLED"],
  CLAIMED: ["PICKUP", "CANCELLED"],
  PICKUP: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["RETURN"],
  RETURN: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, userId, note } = body

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { partner: true },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const validNextStatuses = VALID_TRANSITIONS[booking.leadStatus]
    if (!validNextStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${booking.leadStatus} to ${status}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { leadStatus: status }

    if (status === "CLAIMED") {
      updateData.claimedById = userId
      updateData.claimedAt = new Date()
    } else if (status === "PICKUP") {
      updateData.pickupConfirmedById = userId
      updateData.pickupConfirmedAt = new Date()
    } else if (status === "RETURN") {
      updateData.returnConfirmedById = userId
      updateData.returnConfirmedAt = new Date()
    } else if (status === "COMPLETED") {
      await prisma.commissionLog.create({
        data: {
          partnerId: booking.partnerId,
          bookingId: booking.id,
          bookingAmount: booking.totalPrice,
          commissionRate: booking.partner.commissionRate,
          commissionAmount: booking.totalPrice.toNumber() * (booking.partner.commissionRate.toNumber() / 100),
        },
      })
    } else if (status === "CANCELLED" && note) {
      updateData.cancellationReason = note
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error("Error updating lead status:", error)
    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    )
  }
}
