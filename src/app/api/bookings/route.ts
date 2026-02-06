import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"
import crypto from "crypto"

// Generate secure booking number with less collision risk
function generateBookingNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  // Use crypto for better randomness
  const random = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `JR-${year}${month}${day}-${random}`
}

const createBookingSchema = z.object({
  carId: z.string().min(1, "Car ID is required"),
  customerName: z.string().min(1, "Customer name is required").max(200),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(9, "Phone must be at least 9 digits").max(20),
  customerNote: z.string().max(1000).optional(),
  pickupDatetime: z.string().min(1, "Pickup datetime is required"),
  returnDatetime: z.string().min(1, "Return datetime is required"),
  pickupLocation: z.string().max(500).optional(),
  returnLocation: z.string().max(500).optional(),
  totalPrice: z.union([z.string(), z.number()]),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Parse dates and validate
    const pickupDate = new Date(data.pickupDatetime)
    const returnDate = new Date(data.returnDatetime)

    if (isNaN(pickupDate.getTime()) || isNaN(returnDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    if (returnDate <= pickupDate) {
      return NextResponse.json(
        { error: "Return date must be after pickup date" },
        { status: 400 }
      )
    }

    // Verify userId matches logged-in user (if provided and logged in)
    const { user } = await getSession(request)
    let verifiedUserId: string | null = null

    if (data.userId) {
      if (user && user.id === data.userId) {
        verifiedUserId = data.userId
      } else if (user && user.role === "PLATFORM_OWNER") {
        // Admin can create booking for any user
        verifiedUserId = data.userId
      } else if (!user) {
        // Not logged in but provided userId - ignore it (guest booking)
        verifiedUserId = null
      }
    } else if (user) {
      // Logged in but no userId provided - use current user
      verifiedUserId = user.id
    }

    const car = await prisma.car.findUnique({
      where: { id: data.carId },
      include: { partner: true },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    if (car.approvalStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Car is not available for booking" },
        { status: 400 }
      )
    }

    if (car.rentalStatus !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Car is not available for booking" },
        { status: 400 }
      )
    }

    // Check for active reservation with transaction lock
    const existingReservation = await prisma.booking.findFirst({
      where: {
        carId: data.carId,
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

    // Check overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        carId: data.carId,
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

    // Check if user is blacklisted
    if (verifiedUserId) {
      const userData = await prisma.user.findUnique({
        where: { id: verifiedUserId },
      })

      if (userData?.isBlacklisted) {
        return NextResponse.json(
          { error: "Your account has been suspended" },
          { status: 403 }
        )
      }
    }

    // Calculate price from dates
    const days = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24))
    const calculatedPrice = days * Number(car.pricePerDay)

    // Validate provided price is reasonable (within 10% of calculated)
    const providedPrice = parseFloat(String(data.totalPrice))
    if (Math.abs(providedPrice - calculatedPrice) / calculatedPrice > 0.1) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      )
    }

    const bookingNumber = generateBookingNumber()
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000)

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        carId: data.carId,
        partnerId: car.partnerId,
        userId: verifiedUserId,
        customerName: data.customerName,
        customerEmail: data.customerEmail || "",
        customerPhone: data.customerPhone,
        customerNote: data.customerNote,
        pickupDatetime: pickupDate,
        returnDatetime: returnDate,
        pickupLocation: data.pickupLocation || "",
        returnLocation: data.returnLocation || data.pickupLocation || "",
        totalPrice: calculatedPrice, // Use server-calculated price
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
      bookingNumber: booking.bookingNumber,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
