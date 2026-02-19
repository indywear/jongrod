import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"
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
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ["NEW", "CLAIMED", "PICKUP", "ACTIVE", "RETURN", "COMPLETED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
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

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, booking.partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const validNextStatuses = VALID_TRANSITIONS[booking.leadStatus]
    if (!validNextStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${booking.leadStatus} to ${status}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { leadStatus: status }
    const userId = authResult.user.id

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
      // Calculate commission correctly using toNumber()
      const bookingAmount = booking.totalPrice.toNumber()
      const commissionRate = booking.partner.commissionRate.toNumber()
      const commissionAmount = bookingAmount * (commissionRate / 100)

      await prisma.commissionLog.create({
        data: {
          partnerId: booking.partnerId,
          bookingId: booking.id,
          bookingAmount: bookingAmount,
          commissionRate: commissionRate,
          commissionAmount: commissionAmount,
        },
      })
    } else if (status === "CANCELLED" && note) {
      updateData.cancellationReason = note
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
    })

    // Auto-update car rentalStatus when booking is completed or cancelled
    if (status === "COMPLETED" || status === "CANCELLED") {
      // Check if car has any other active bookings before making it available
      const otherActiveBookings = await prisma.booking.count({
        where: {
          carId: booking.carId,
          id: { not: booking.id },
          leadStatus: { notIn: ["CANCELLED", "COMPLETED"] },
        },
      })

      if (otherActiveBookings === 0) {
        await prisma.car.update({
          where: { id: booking.carId },
          data: { rentalStatus: "AVAILABLE" },
        })
      }
    }

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error("Error updating lead status:", error)
    return NextResponse.json(
      { error: "Failed to update lead status" },
      { status: 500 }
    )
  }
}
