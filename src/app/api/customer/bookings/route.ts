import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")

    if (!userId) {
      return NextResponse.json({ bookings: [] })
    }

    const where: Record<string, unknown> = { userId }

    if (status && status !== "all") {
      where.leadStatus = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        car: {
          select: {
            id: true,
            brand: true,
            model: true,
            year: true,
            images: true,
          },
        },
      },
    })

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      car: {
        id: booking.car.id,
        brand: booking.car.brand,
        model: booking.car.model,
        year: booking.car.year,
        image: Array.isArray(booking.car.images) && booking.car.images.length > 0
          ? booking.car.images[0]
          : null,
      },
      pickupDate: booking.pickupDatetime.toISOString().split("T")[0],
      pickupTime: booking.pickupDatetime.toISOString().split("T")[1].slice(0, 5),
      returnDate: booking.returnDatetime.toISOString().split("T")[0],
      returnTime: booking.returnDatetime.toISOString().split("T")[1].slice(0, 5),
      pickupLocation: booking.pickupLocation,
      returnLocation: booking.returnLocation,
      totalPrice: Number(booking.totalPrice),
      status: booking.leadStatus,
      createdAt: booking.createdAt.toISOString(),
    }))

    return NextResponse.json({ bookings: formattedBookings })
  } catch (error) {
    console.error("Error fetching customer bookings:", error)
    return NextResponse.json({ bookings: [] })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, status } = body

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: "Booking ID and status are required" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.leadStatus !== "NEW") {
      return NextResponse.json(
        { error: "Can only cancel NEW bookings" },
        { status: 400 }
      )
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { leadStatus: status },
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
