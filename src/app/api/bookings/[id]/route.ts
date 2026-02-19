import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession, requireAuth, verifyUserOwnership } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        car: true,
        partner: {
          select: {
            id: true,
            name: true,
            phone: true,
            contactEmail: true,
          },
        },
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

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Check access permissions
    const { user } = await getSession(request)

    if (!user) {
      // Unauthenticated - only minimal info, no personal or pricing data
      return NextResponse.json({
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          leadStatus: booking.leadStatus,
        },
      })
    }

    // Admin can see all
    if (user.role === "PLATFORM_OWNER") {
      return NextResponse.json({ booking })
    }

    // Partner can see their bookings
    if (user.role === "PARTNER_ADMIN" && user.partnerId === booking.partnerId) {
      return NextResponse.json({ booking })
    }

    // Customer can only see their own bookings
    if (booking.userId === user.id) {
      return NextResponse.json({ booking })
    }

    // Otherwise return limited info
    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        leadStatus: booking.leadStatus,
      },
    })
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { leadStatus } = body

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Validate permission
    const user = authResult.user
    let canModify = false

    if (user.role === "PLATFORM_OWNER") {
      canModify = true
    } else if (user.role === "PARTNER_ADMIN" && user.partnerId === booking.partnerId) {
      canModify = true
    } else if (booking.userId === user.id) {
      // Customer can only cancel their own booking
      canModify = leadStatus === "CANCELLED"
    }

    if (!canModify) {
      return NextResponse.json(
        { error: "Not authorized to modify this booking" },
        { status: 403 }
      )
    }

    // Validate status transition
    if (leadStatus === "CANCELLED") {
      if (!["NEW", "CLAIMED"].includes(booking.leadStatus)) {
        return NextResponse.json(
          { error: "Cannot cancel booking at this stage" },
          { status: 400 }
        )
      }
    }

    // Only allow valid status values
    const validStatuses = ["NEW", "CLAIMED", "PICKUP", "ACTIVE", "RETURN", "COMPLETED", "CANCELLED"]
    if (!validStatuses.includes(leadStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        leadStatus,
        cancellationReason: leadStatus === "CANCELLED" ? body.reason || "Cancelled" : undefined,
      },
    })

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}
