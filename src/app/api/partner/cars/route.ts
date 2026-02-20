import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"
import { z } from "zod"

const createCarSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.union([z.string(), z.number()]),
  licensePlate: z.string().min(1, "License plate is required"),
  category: z.enum(["SEDAN", "SUV", "VAN", "PICKUP", "LUXURY", "COMPACT", "MOTORCYCLE"]),
  transmission: z.enum(["AUTO", "MANUAL"]),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "EV"]),
  seats: z.union([z.string(), z.number()]),
  doors: z.union([z.string(), z.number()]),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  pricePerDay: z.union([z.string(), z.number()]),
})

/**
 * @swagger
 * /api/partner/cars:
 *   get:
 *     tags:
 *       - Partner
 *     summary: List partner's cars
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *         description: Partner ID (defaults to authenticated user's partner)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of cars with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - not authenticated or not a partner
 *   post:
 *     tags:
 *       - Partner
 *     summary: Add a new car
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand
 *               - model
 *               - year
 *               - licensePlate
 *               - category
 *               - transmission
 *               - fuelType
 *               - seats
 *               - doors
 *               - pricePerDay
 *             properties:
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               licensePlate:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [SEDAN, SUV, VAN, PICKUP, LUXURY, COMPACT, MOTORCYCLE]
 *               transmission:
 *                 type: string
 *                 enum: [AUTO, MANUAL]
 *               fuelType:
 *                 type: string
 *                 enum: [PETROL, DIESEL, HYBRID, EV]
 *               seats:
 *                 type: integer
 *               doors:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               pricePerDay:
 *                 type: number
 *     responses:
 *       201:
 *         description: Car created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 car:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - not authenticated or not a partner
 *       409:
 *         description: License plate already exists
 */
export async function GET(request: NextRequest) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Verify partner ownership
    const targetPartnerId = partnerId || authResult.user.partnerId

    if (!targetPartnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Verify the user has access to this partner
    const ownershipResult = await verifyPartnerOwnership(request, targetPartnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where: { partnerId: targetPartnerId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.car.count({ where: { partnerId: targetPartnerId } }),
    ])

    return NextResponse.json({
      cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching partner cars:", error)
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()

    // Validate input
    const validation = createCarSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Use partner ID from the authenticated user or from body
    const partnerId = body.partnerId || authResult.user.partnerId

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Verify the user has access to this partner
    const ownershipResult = await verifyPartnerOwnership(request, partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const data = validation.data

    // Check for existing license plate
    const existingCar = await prisma.car.findUnique({
      where: { licensePlate: data.licensePlate },
    })

    if (existingCar) {
      return NextResponse.json(
        { error: "License plate already exists" },
        { status: 409 }
      )
    }

    const car = await prisma.car.create({
      data: {
        partnerId,
        brand: data.brand,
        model: data.model,
        year: parseInt(String(data.year)),
        licensePlate: data.licensePlate,
        category: data.category,
        transmission: data.transmission,
        fuelType: data.fuelType,
        seats: parseInt(String(data.seats)),
        doors: parseInt(String(data.doors)),
        features: data.features || [],
        images: data.images || [],
        pricePerDay: parseFloat(String(data.pricePerDay)),
      },
    })

    return NextResponse.json({ car }, { status: 201 })
  } catch (error) {
    console.error("Error creating car:", error)
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    )
  }
}
