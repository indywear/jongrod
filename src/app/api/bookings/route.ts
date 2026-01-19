import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function generateBookingNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  return `JR-${year}${month}${day}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      carId,
      customerName,
      customerEmail,
      customerPhone,
      customerNote,
      pickupDatetime,
      returnDatetime,
      pickupLocation,
      returnLocation,
      totalPrice,
      userId,
    } = body

    if (!carId || !customerName || !customerPhone || !pickupDatetime || !returnDatetime || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { partner: true },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    if (car.rentalStatus !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Car is not available for booking" },
        { status: 400 }
      )
    }

    const existingReservation = await prisma.booking.findFirst({
      where: {
        carId,
        reservedUntil: {
          gt: new Date(),
        },
        leadStatus: "NEW",
      },
    })

    if (existingReservation) {
      return NextResponse.json(
        { error: "รถคันนี้กำลังถูกจองโดยผู้อื่น กรุณารอสักครู่หรือเลือกรถคันอื่น" },
        { status: 409 }
      )
    }

    const pickupDate = new Date(pickupDatetime)
    const returnDate = new Date(returnDatetime)
    
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        carId,
        leadStatus: {
          notIn: ["CANCELLED", "COMPLETED"],
        },
        OR: [
          {
            AND: [
              { pickupDatetime: { lte: pickupDate } },
              { returnDatetime: { gt: pickupDate } },
            ],
          },
          {
            AND: [
              { pickupDatetime: { lt: returnDate } },
              { returnDatetime: { gte: returnDate } },
            ],
          },
          {
            AND: [
              { pickupDatetime: { gte: pickupDate } },
              { returnDatetime: { lte: returnDate } },
            ],
          },
        ],
      },
    })

    if (overlappingBooking) {
      return NextResponse.json(
        { error: "รถคันนี้ถูกจองในช่วงวันที่ที่คุณเลือกแล้ว กรุณาเลือกวันที่อื่นหรือเลือกรถคันอื่น" },
        { status: 409 }
      )
    }

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (user?.isBlacklisted) {
        return NextResponse.json(
          { error: "Your account has been suspended" },
          { status: 403 }
        )
      }
    }

    const bookingNumber = generateBookingNumber()
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000)

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        carId,
        partnerId: car.partnerId,
        userId: userId || null,
        customerName,
        customerEmail: customerEmail || "",
        customerPhone,
        customerNote,
        pickupDatetime: new Date(pickupDatetime),
        returnDatetime: new Date(returnDatetime),
        pickupLocation: pickupLocation || "",
        returnLocation: returnLocation || pickupLocation || "",
        totalPrice: parseFloat(totalPrice),
        reservedUntil,
      },
      include: {
        car: true,
        partner: {
          select: { name: true, phone: true, telegramChatId: true },
        },
      },
    })

    return NextResponse.json({ 
      booking, 
      bookingNumber: booking.bookingNumber 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
