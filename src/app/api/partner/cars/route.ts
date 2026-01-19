import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    const cars = await prisma.car.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ cars })
  } catch (error) {
    console.error("Error fetching partner cars:", error)
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      partnerId,
      brand,
      model,
      year,
      licensePlate,
      category,
      transmission,
      fuelType,
      seats,
      doors,
      features,
      images,
      pricePerDay,
    } = body

    if (!partnerId || !brand || !model || !licensePlate || !pricePerDay) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const existingCar = await prisma.car.findUnique({
      where: { licensePlate },
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
        brand,
        model,
        year: parseInt(year),
        licensePlate,
        category,
        transmission,
        fuelType,
        seats: parseInt(seats),
        doors: parseInt(doors),
        features: features || [],
        images: images || [],
        pricePerDay: parseFloat(pricePerDay),
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
