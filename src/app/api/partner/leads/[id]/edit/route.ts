import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"

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
    const {
      customerName,
      customerPhone,
      customerEmail,
      pickupDatetime,
      returnDatetime,
      pickupLocation,
      returnLocation,
      customerNote,
    } = body

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { car: true },
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

    if (!["NEW", "CLAIMED"].includes(booking.leadStatus)) {
      return NextResponse.json(
        { error: "ไม่สามารถแก้ไขการจองได้หลังจากยืนยันรับรถแล้ว" },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (customerName) updateData.customerName = customerName
    if (customerPhone) updateData.customerPhone = customerPhone
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail
    if (pickupLocation) updateData.pickupLocation = pickupLocation
    if (returnLocation !== undefined) updateData.returnLocation = returnLocation
    if (customerNote !== undefined) updateData.customerNote = customerNote

    if (pickupDatetime) {
      const newPickup = new Date(pickupDatetime)
      if (isNaN(newPickup.getTime())) {
        return NextResponse.json(
          { error: "Invalid pickup datetime format" },
          { status: 400 }
        )
      }
      updateData.pickupDatetime = newPickup
    }

    if (returnDatetime) {
      const newReturn = new Date(returnDatetime)
      if (isNaN(newReturn.getTime())) {
        return NextResponse.json(
          { error: "Invalid return datetime format" },
          { status: 400 }
        )
      }
      const originalReturn = booking.returnDatetime

      if (newReturn < originalReturn) {
        return NextResponse.json(
          { error: "ไม่สามารถลดวันที่คืนรถได้ สามารถเพิ่มวันที่คืนรถได้เท่านั้น" },
          { status: 400 }
        )
      }

      updateData.returnDatetime = newReturn
    }

    if (pickupDatetime || returnDatetime) {
      const pickup = pickupDatetime ? new Date(pickupDatetime) : booking.pickupDatetime
      const returnDate = returnDatetime ? new Date(returnDatetime) : booking.returnDatetime

      const days = Math.ceil((returnDate.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24))
      const pricePerDay = Number(booking.car.pricePerDay)
      updateData.totalPrice = days * pricePerDay
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        car: true,
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
