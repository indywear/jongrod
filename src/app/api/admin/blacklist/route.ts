import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
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
  try {
    const body = await request.json()
    const { documentNumber, fullName, phone, email, reason, addedById } = body

    if (!documentNumber || !fullName || !reason || !addedById) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const existing = await prisma.blacklist.findUnique({
      where: { documentNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Document number already in blacklist" },
        { status: 400 }
      )
    }

    const blacklistEntry = await prisma.blacklist.create({
      data: {
        documentNumber,
        fullName,
        phone,
        email,
        reason,
        addedById,
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
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
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
