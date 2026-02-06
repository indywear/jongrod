import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"

export async function GET(
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

    const car = await prisma.car.findUnique({
      where: { id },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    // Verify the user has access to this car's partner
    const ownershipResult = await verifyPartnerOwnership(request, car.partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error("Error fetching car:", error)
    return NextResponse.json(
      { error: "Failed to fetch car" },
      { status: 500 }
    )
  }
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

    const car = await prisma.car.findUnique({
      where: { id },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    // Verify the user has access to this car's partner
    const ownershipResult = await verifyPartnerOwnership(request, car.partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    // Validate category, transmission, fuelType, rentalStatus if provided
    const validCategories = ["SEDAN", "SUV", "VAN", "PICKUP", "LUXURY", "COMPACT", "MOTORCYCLE"]
    const validTransmissions = ["AUTO", "MANUAL"]
    const validFuelTypes = ["PETROL", "DIESEL", "HYBRID", "EV"]
    const validRentalStatuses = ["AVAILABLE", "RENTED", "MAINTENANCE"]

    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }
    if (body.transmission && !validTransmissions.includes(body.transmission)) {
      return NextResponse.json({ error: "Invalid transmission" }, { status: 400 })
    }
    if (body.fuelType && !validFuelTypes.includes(body.fuelType)) {
      return NextResponse.json({ error: "Invalid fuel type" }, { status: 400 })
    }
    if (body.rentalStatus && !validRentalStatuses.includes(body.rentalStatus)) {
      return NextResponse.json({ error: "Invalid rental status" }, { status: 400 })
    }

    const updatedCar = await prisma.car.update({
      where: { id },
      data: {
        brand: body.brand,
        model: body.model,
        year: body.year ? parseInt(body.year) : undefined,
        licensePlate: body.licensePlate,
        category: body.category,
        transmission: body.transmission,
        fuelType: body.fuelType,
        seats: body.seats ? parseInt(body.seats) : undefined,
        doors: body.doors ? parseInt(body.doors) : undefined,
        features: body.features,
        images: body.images,
        pricePerDay: body.pricePerDay ? parseFloat(body.pricePerDay) : undefined,
        rentalStatus: body.rentalStatus,
      },
    })

    return NextResponse.json({ car: updatedCar })
  } catch (error) {
    console.error("Error updating car:", error)
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const car = await prisma.car.findUnique({
      where: { id },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    // Verify the user has access to this car's partner
    const ownershipResult = await verifyPartnerOwnership(request, car.partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    await prisma.car.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Car deleted successfully" })
  } catch (error) {
    console.error("Error deleting car:", error)
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    )
  }
}
