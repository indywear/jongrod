import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiKey } from "@/lib/api-key"
import { requireBearerToken } from "@/lib/jwt"
import { z } from "zod"
import crypto from "crypto"

function generateBookingNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const random = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `JR-${year}${month}${day}-${random}`
}

const createBookingSchema = z.object({
  carId: z.string().min(1),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().min(9).max(20),
  customerNote: z.string().max(1000).optional(),
  pickupDatetime: z.string().min(1),
  returnDatetime: z.string().min(1),
  pickupLocation: z.string().max(500).optional(),
  returnLocation: z.string().max(500).optional(),
})

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: List user's bookings
 *     description: Returns bookings for the authenticated user (from JWT token).
 *     tags:
 *       - External Bookings
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [NEW, CLAIMED, PICKUP, ACTIVE, RETURN, COMPLETED, CANCELLED]
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of bookings
 *       401:
 *         description: Invalid credentials
 *   post:
 *     summary: Create a booking
 *     description: Create a new car booking for the authenticated user.
 *     tags:
 *       - External Bookings
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - carId
 *               - customerName
 *               - customerPhone
 *               - pickupDatetime
 *               - returnDatetime
 *             properties:
 *               carId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerNote:
 *                 type: string
 *               pickupDatetime:
 *                 type: string
 *                 format: date-time
 *               returnDatetime:
 *                 type: string
 *                 format: date-time
 *               pickupLocation:
 *                 type: string
 *               returnLocation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Car not available
 */
export async function GET(request: NextRequest) {
  const apiKeyResult = await requireApiKey(request, ["read"])
  if (apiKeyResult instanceof NextResponse) return apiKeyResult

  const authResult = await requireBearerToken(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId: authResult.user.sub }
    if (status) where.leadStatus = status

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          car: {
            select: {
              id: true, brand: true, model: true, year: true,
              licensePlate: true, category: true, images: true,
              pricePerDay: true, rentalStatus: true,
            },
          },
          partner: {
            select: { id: true, name: true, phone: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("V1 bookings list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const apiKeyResult = await requireApiKey(request, ["write"])
  if (apiKeyResult instanceof NextResponse) return apiKeyResult

  const authResult = await requireBearerToken(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data
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

    const car = await prisma.car.findUnique({
      where: { id: data.carId },
      include: { partner: true },
    })

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 })
    }

    if (car.approvalStatus !== "APPROVED" || car.rentalStatus !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Car is not available for booking" },
        { status: 400 }
      )
    }

    // Check overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        carId: data.carId,
        leadStatus: { notIn: ["CANCELLED", "COMPLETED"] },
        OR: [
          { AND: [{ pickupDatetime: { lte: pickupDate } }, { returnDatetime: { gt: pickupDate } }] },
          { AND: [{ pickupDatetime: { lt: returnDate } }, { returnDatetime: { gte: returnDate } }] },
          { AND: [{ pickupDatetime: { gte: pickupDate } }, { returnDatetime: { lte: returnDate } }] },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: "Car is not available for the selected dates" },
        { status: 409 }
      )
    }

    // Check blacklist
    const userData = await prisma.user.findUnique({
      where: { id: authResult.user.sub },
    })
    if (userData?.isBlacklisted) {
      return NextResponse.json(
        { error: "Account is suspended" },
        { status: 403 }
      )
    }

    const days = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalPrice = days * Number(car.pricePerDay)
    const bookingNumber = generateBookingNumber()
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000)

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          bookingNumber,
          carId: data.carId,
          partnerId: car.partnerId,
          userId: authResult.user.sub,
          customerName: data.customerName,
          customerEmail: data.customerEmail || "",
          customerPhone: data.customerPhone,
          customerNote: data.customerNote,
          pickupDatetime: pickupDate,
          returnDatetime: returnDate,
          pickupLocation: data.pickupLocation || "",
          returnLocation: data.returnLocation || data.pickupLocation || "",
          totalPrice,
          reservedUntil,
        },
        include: {
          car: true,
          partner: { select: { name: true, phone: true } },
        },
      }),
      prisma.car.update({
        where: { id: data.carId },
        data: { rentalStatus: "RENTED" },
      }),
    ])

    return NextResponse.json(
      { booking, bookingNumber: booking.bookingNumber },
      { status: 201 }
    )
  } catch (error) {
    console.error("V1 booking create error:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
