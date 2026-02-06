import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

const LOCK_DURATION_MS = 5 * 60 * 1000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await params
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId || typeof sessionId !== "string" || sessionId.length < 10) {
      return NextResponse.json(
        { error: "Valid session ID is required" },
        { status: 400 }
      )
    }

    const now = new Date()
    const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS)

    // Atomic lock acquisition using a single update with conditions
    // This prevents race conditions by checking and updating in one operation
    try {
      const updatedCar = await prisma.car.update({
        where: {
          id: carId,
          // Only update if:
          // 1. Car is not locked (lockedUntil is null or in the past)
          // 2. OR car is locked by the same session (allow refresh)
          OR: [
            { lockedUntil: null },
            { lockedUntil: { lt: now } },
            { lockedBySession: sessionId },
          ],
        },
        data: {
          lockedUntil,
          lockedBySession: sessionId,
        },
      })

      return NextResponse.json({
        locked: true,
        lockedByOther: false,
        lockedUntil: updatedCar.lockedUntil?.toISOString(),
        message: "Lock acquired successfully",
      })
    } catch (error) {
      // If update fails due to no matching record, it means car is locked by someone else
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        // Fetch car to get lock info for error message
        const car = await prisma.car.findUnique({
          where: { id: carId },
        })

        if (!car) {
          return NextResponse.json(
            { error: "Car not found" },
            { status: 404 }
          )
        }

        if (car.lockedUntil && car.lockedUntil > now) {
          const remainingMs = car.lockedUntil.getTime() - now.getTime()
          const remainingMinutes = Math.ceil(remainingMs / 60000)

          return NextResponse.json(
            {
              locked: true,
              lockedByOther: true,
              remainingMinutes,
              message: `รถคันนี้กำลังถูกจองโดยผู้อื่น กรุณารอประมาณ ${remainingMinutes} นาที หรือเลือกรถคันอื่น`,
            },
            { status: 409 }
          )
        }

        // Car exists but not locked - retry once
        const retryUpdate = await prisma.car.update({
          where: { id: carId },
          data: {
            lockedUntil,
            lockedBySession: sessionId,
          },
        })

        return NextResponse.json({
          locked: true,
          lockedByOther: false,
          lockedUntil: retryUpdate.lockedUntil?.toISOString(),
          message: "Lock acquired successfully",
        })
      }
      throw error
    }
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

    if (!sessionId || sessionId.length < 10) {
      return NextResponse.json(
        { error: "Valid session ID is required" },
        { status: 400 }
      )
    }

    // Atomic unlock - only unlock if the session matches
    // This prevents unauthorized users from unlocking cars they don't own
    try {
      await prisma.car.update({
        where: {
          id: carId,
          lockedBySession: sessionId, // Only unlock if we own the lock
        },
        data: {
          lockedUntil: null,
          lockedBySession: null,
        },
      })

      return NextResponse.json({ unlocked: true })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        // Car not found or not locked by this session
        const car = await prisma.car.findUnique({
          where: { id: carId },
        })

        if (!car) {
          return NextResponse.json(
            { error: "Car not found" },
            { status: 404 }
          )
        }

        // Car exists but not locked by this session - forbidden
        if (car.lockedBySession && car.lockedBySession !== sessionId) {
          return NextResponse.json(
            { error: "ไม่สามารถปลดล็อครถได้ เนื่องจากคุณไม่ได้เป็นผู้ล็อค" },
            { status: 403 }
          )
        }

        // Car is not locked at all - return success (idempotent)
        return NextResponse.json({ unlocked: true })
      }
      throw error
    }
  } catch (error) {
    console.error("Error unlocking car:", error)
    return NextResponse.json(
      { error: "Failed to unlock car" },
      { status: 500 }
    )
  }
}
