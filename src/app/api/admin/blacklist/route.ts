import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const createBlacklistSchema = z.object({
  documentNumber: z.string().min(1, "Document number is required"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  reason: z.string().min(1, "Reason is required"),
})

export async function GET(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const blacklist = await prisma.blacklist.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        addedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ blacklist })
  } catch (error) {
    console.error("Error fetching blacklist:", error)
    return NextResponse.json({ blacklist: [] })
  }
}

export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()

    // Validate input
    const validation = createBlacklistSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { documentNumber, fullName, phone, email, reason } = validation.data

    // Check if already exists
    const existing = await prisma.blacklist.findUnique({
      where: { documentNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Document number already in blacklist" },
        { status: 400 }
      )
    }

    // Use authenticated user's ID
    const blacklistEntry = await prisma.blacklist.create({
      data: {
        documentNumber,
        fullName,
        phone,
        email,
        reason,
        addedById: authResult.user.id,
      },
    })

    return NextResponse.json({ blacklist: blacklistEntry })
  } catch (error) {
    console.error("Error creating blacklist entry:", error)
    return NextResponse.json(
      { error: "Failed to create blacklist entry" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    const entry = await prisma.blacklist.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json(
        { error: "Blacklist entry not found" },
        { status: 404 }
      )
    }

    await prisma.blacklist.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blacklist entry:", error)
    return NextResponse.json(
      { error: "Failed to delete blacklist entry" },
      { status: 500 }
    )
  }
}
