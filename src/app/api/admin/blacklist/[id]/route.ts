import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    return NextResponse.json({ message: "Removed from blacklist" })
  } catch (error) {
    console.error("Error removing from blacklist:", error)
    return NextResponse.json(
      { error: "Failed to remove from blacklist" },
      { status: 500 }
    )
  }
}
