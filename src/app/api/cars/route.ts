import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ApprovalStatus, RentalStatus, CarCategory, Transmission, FuelType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get("category") as CarCategory | null
    const transmission = searchParams.get("transmission") as Transmission | null
    const fuelType = searchParams.get("fuelType") as FuelType | null
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const brand = searchParams.get("brand")
    const sort = searchParams.get("sort") || "newest"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")

    const where: Record<string, unknown> = {
      approvalStatus: ApprovalStatus.APPROVED,
      rentalStatus: RentalStatus.AVAILABLE,
    }

    if (category) where.category = category
    if (transmission) where.transmission = transmission
    if (fuelType) where.fuelType = fuelType
    if (brand) where.brand = { contains: brand, mode: "insensitive" }
    if (minPrice || maxPrice) {
      where.pricePerDay = {}
      if (minPrice) (where.pricePerDay as Record<string, number>).gte = parseFloat(minPrice)
      if (maxPrice) (where.pricePerDay as Record<string, number>).lte = parseFloat(maxPrice)
    }

    const orderBy: Record<string, string> = {}
    switch (sort) {
      case "price_asc":
        orderBy.pricePerDay = "asc"
        break
      case "price_desc":
        orderBy.pricePerDay = "desc"
        break
      default:
        orderBy.createdAt = "desc"
    }

    const reservedBookings = await prisma.booking.findMany({
      where: {
        reservedUntil: {
          gt: new Date(),
        },
        leadStatus: "NEW",
      },
      select: { carId: true },
    })
    const reservedCarIds = reservedBookings.map((b) => b.carId)

    if (reservedCarIds.length > 0) {
      where.id = { notIn: reservedCarIds }
    }

    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      prisma.car.count({ where }),
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
    console.error("Error fetching cars:", error)
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    )
  }
}
