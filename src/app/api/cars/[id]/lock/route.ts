import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const LOCK_DURATION_MS = 5 * 60 * 1000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await params
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    const now = new Date()

    if (car.lockedUntil && car.lockedUntil > now && car.lockedBySession !== sessionId) {
      const remainingMs = car.lockedUntil.getTime() - now.getTime()
      const remainingMinutes = Math.ceil(remainingMs / 60000)
      
      return NextResponse.json(
        { 
          locked: true,
          lockedByOther: true,
          remainingMinutes,
          message: `รถคันนี้กำลังถูกจองโดยผู้อื่น กรุณารอประมาณ ${remainingMinutes} นาที หรือเลือกรถคันอื่น`
        },
        { status: 409 }
      )
    }

    const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS)

    await prisma.car.update({
      where: { id: carId },
      data: {
        lockedUntil,
        lockedBySession: sessionId,
      },
    })

    return NextResponse.json({
      locked: true,
      lockedByOther: false,
      lockedUntil: lockedUntil.toISOString(),
      message: "Lock acquired successfully",
    })
  } catch (error) {
    console.error("Error locking car:", error)
    return NextResponse.json(
      { error: "Failed to lock car" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await params
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      )
    }

    const car = await prisma.car.findUnique({
      where: { id: carId },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    if (car.lockedBySession === sessionId) {
      await prisma.car.update({
        where: { id: carId },
        data: {
          lockedUntil: null,
          lockedBySession: null,
        },
      })
    }

    return NextResponse.json({ unlocked: true })
  } catch (error) {
    console.error("Error unlocking car:", error)
    return NextResponse.json(
      { error: "Failed to unlock car" },
      { status: 500 }
    )
  }
}
