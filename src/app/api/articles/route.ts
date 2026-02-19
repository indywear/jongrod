import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50)
    const skip = (page - 1) * limit
    const category = searchParams.get("category")

    const where: { isPublished: boolean; category?: string } = {
      isPublished: true,
    }
    if (category) where.category = category

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          titleTh: true,
          titleEn: true,
          excerptTh: true,
          excerptEn: true,
          featuredImage: true,
          category: true,
          publishedAt: true,
          author: {
            select: { firstName: true, lastName: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}
