import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * @swagger
 * /api/admin/cms/banners/{id}:
 *   patch:
 *     tags:
 *       - Admin Banners
 *     summary: Update banner
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               position:
 *                 type: string
 *                 enum: [HOMEPAGE_HERO, HOMEPAGE_MIDDLE, LISTING_TOP, POPUP]
 *               sortOrder:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       400:
 *         description: Invalid position
 *       404:
 *         description: Banner not found
 *   delete:
 *     tags:
 *       - Admin Banners
 *     summary: Delete banner
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 */
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
