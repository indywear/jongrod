import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (APPROVED or REJECTED) is required" },
        { status: 400 }
      )
    }

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
        approvalStatus: status,
      },
    })

    return NextResponse.json({ car: updatedCar })
  } catch (error) {
    console.error("Error updating car approval:", error)
    return NextResponse.json(
      { error: "Failed to update car approval" },
      { status: 500 }
    )
  }
}
