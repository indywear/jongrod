import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

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

    const banner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      )
    }

    // Validate position if provided
    if (body.position) {
      const validPositions = ["HOMEPAGE_HERO", "HOMEPAGE_MIDDLE", "LISTING_TOP", "POPUP"]
      if (!validPositions.includes(body.position)) {
        return NextResponse.json(
          { error: "Invalid position" },
          { status: 400 }
        )
      }
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        title: body.title,
        linkUrl: body.linkUrl,
        position: body.position,
        sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({ banner: updatedBanner })
  } catch (error) {
    console.error("Error updating banner:", error)
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const banner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      )
    }

    // Delete image from storage if it exists
    if (banner.imageUrl) {
      try {
        const urlParts = banner.imageUrl.split("/banners/")
        if (urlParts.length > 1) {
          const path = `banners/${urlParts[1]}`
          await supabaseAdmin.storage.from("banners").remove([path])
        }
      } catch (storageError) {
        console.error("Error deleting banner image from storage:", storageError)
      }
    }

    await prisma.banner.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Banner deleted successfully" })
  } catch (error) {
    console.error("Error deleting banner:", error)
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    )
  }
}
