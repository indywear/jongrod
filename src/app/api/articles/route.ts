import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @swagger
 * /api/articles:
 *   get:
 *     tags:
 *       - Content
 *     summary: List published articles
 *     description: Returns a paginated list of published articles. Supports filtering by category.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           maximum: 50
 *         description: Number of articles per page (max 50)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by article category
 *     responses:
 *       200:
 *         description: Paginated list of articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       titleTh:
 *                         type: string
 *                       titleEn:
 *                         type: string
 *                       excerptTh:
 *                         type: string
 *                       excerptEn:
 *                         type: string
 *                       featuredImage:
 *                         type: string
 *                       category:
 *                         type: string
 *                       publishedAt:
 *                         type: string
 *                         format: date-time
 *                       author:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
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
