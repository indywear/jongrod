import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
