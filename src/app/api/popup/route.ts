import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUrl } from "@/lib/storage"

/**
 * @swagger
 * /api/popup:
 *   get:
 *     tags:
 *       - Content
 *     summary: Get active popup banners
 *     description: Returns the currently active popup banner based on date range and sort order. Returns null if no active popup is available.
 *     responses:
 *       200:
 *         description: Active popup banner (or null if none active)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 popup:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                     linkUrl:
 *                       type: string
 *                       format: uri
 */
export async function GET() {
  try {
    const now = new Date()

    // Find active popup banner
    const popup = await prisma.banner.findFirst({
      where: {
        position: "POPUP",
        isActive: true,
        OR: [
          // No date restrictions
          {
            startDate: null,
            endDate: null,
          },
          // Within date range
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          // Started but no end date
          {
            startDate: { lte: now },
            endDate: null,
          },
          // Has end date but no start date
          {
            startDate: null,
            endDate: { gte: now },
          },
        ],
      },
      orderBy: { sortOrder: "asc" },
    })

    if (!popup) {
      return NextResponse.json({ popup: null })
    }

    // Convert image path to URL if needed
    let imageUrl = popup.imageUrl
    if (imageUrl && !imageUrl.startsWith("http")) {
      if (imageUrl.startsWith("/uploads/")) {
        // Local path, use as-is
      } else if (imageUrl.startsWith("uploads/")) {
        imageUrl = `/${imageUrl}`
      } else {
        imageUrl = getPublicUrl("banners", imageUrl)
      }
    }

    return NextResponse.json({
      popup: {
        id: popup.id,
        title: popup.title,
        imageUrl,
        linkUrl: popup.linkUrl,
      },
    })
  } catch (error) {
    console.error("Error fetching popup:", error)
    return NextResponse.json({ popup: null })
  }
}
