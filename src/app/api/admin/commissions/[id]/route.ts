import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (status !== "PAID") {
      return NextResponse.json(
        { error: "Only PAID status is allowed" },
        { status: 400 }
      )
    }

    const commission = await prisma.commissionLog.findUnique({
      where: { id },
    })

    if (!commission) {
      return NextResponse.json(
        { error: "Commission log not found" },
        { status: 404 }
      )
    }

    if (commission.status === "PAID") {
      return NextResponse.json(
        { error: "Commission already marked as paid" },
        { status: 400 }
      )
    }

    const updatedCommission = await prisma.commissionLog.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    })

    return NextResponse.json({ commission: updatedCommission })
  } catch (error) {
    console.error("Error updating commission:", error)
    return NextResponse.json(
      { error: "Failed to update commission" },
      { status: 500 }
    )
  }
}
