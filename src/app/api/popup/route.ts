import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUrl } from "@/lib/storage"

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
